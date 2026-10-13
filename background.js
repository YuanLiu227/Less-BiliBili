import './settings.js';

const {
  DEFAULT_MODULES, MODULE_RULESETS, FEED_URL, CONTENT_HOSTS, mergeSettings,
  shouldRedirectUrl, getEnabledRulesets, wildcardSource, parseWhitelist
} = globalThis.BilibiliLessSettings;
const ALL_RULESETS = Object.values(MODULE_RULESETS).flat();
let settingsQueue = Promise.resolve();

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return mergeSettings(result.settings);
}

async function syncNetRules(settings) {
  const enableRulesetIds = getEnabledRulesets(settings);
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds,
    disableRulesetIds: ALL_RULESETS.filter(id => !enableRulesetIds.includes(id))
  });
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = settings.enabled ? settings.whitelist.allowedUrls.map((pattern, index) => ({
    id: 10000 + index,
    priority: 100,
    action: { type: 'allowAllRequests' },
    condition: { regexFilter: wildcardSource(pattern), isUrlFilterCaseSensitive: true, resourceTypes: ['main_frame'] }
  })) : [];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(rule => rule.id), addRules
  });
}

async function applySettingsToTab(tab, settings) {
  if (!tab.id || !tab.url) return;
  if (shouldRedirectUrl(tab.url, settings)) {
    await chrome.tabs.update(tab.id, { url: FEED_URL });
    return;
  }
  if (!CONTENT_HOSTS.includes(new URL(tab.url).hostname)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'BILIBILI_LESS_APPLY_SETTINGS', settings });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id }, files: ['settings.js', 'content.js']
    });
  }
}

async function applySettingsToOpenTabs(settings) {
  const tabs = await chrome.tabs.query({ url: ['*://*.bilibili.com/*'] });
  const results = await Promise.allSettled(tabs.map(tab => applySettingsToTab(tab, settings)));
  results.filter(result => result.status === 'rejected')
    .forEach(result => console.warn('Bilibili Less: page sync failed', result.reason));
}

function scheduleEffects() {
  const task = settingsQueue.catch(() => {}).then(async () => {
    const settings = await getSettings();
    await syncNetRules(settings);
    await applySettingsToOpenTabs(settings);
  });
  settingsQueue = task;
  task.catch(error => console.error('Bilibili Less: settings sync failed', error));
  return task;
}

// Merge UI writes against the latest value, including writes from another window.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !['BILIBILI_LESS_PATCH_SETTINGS', 'BILIBILI_LESS_RESET_MODULES'].includes(message?.type)) return;
  const task = settingsQueue.catch(() => {}).then(async () => {
    const previous = await getSettings();
    const patch = message.patch || {};
    if (patch.whitelist) parseWhitelist(patch.whitelist.allowedUrls.join('\n'));
    const settings = message.type === 'BILIBILI_LESS_RESET_MODULES'
      ? mergeSettings({ ...previous, enabled: true, modules: { ...DEFAULT_MODULES } })
      : mergeSettings({ ...previous, ...patch,
        modules: { ...previous.modules, ...patch.modules },
        whitelist: { ...previous.whitelist, ...patch.whitelist } });
    await syncNetRules(settings);
    await chrome.storage.local.set({ settings });
    return settings;
  });
  settingsQueue = task;
  task.then(settings => sendResponse({ ok: true, settings }),
    error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onStartup.addListener(scheduleEffects);
chrome.runtime.onInstalled.addListener(scheduleEffects);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) scheduleEffects();
});

async function checkNavigation(details) {
  if (details.frameId !== 0) return;
  try {
    if (shouldRedirectUrl(details.url, await getSettings())) {
      await chrome.tabs.update(details.tabId, { url: FEED_URL });
    }
  } catch (error) {
    console.warn('Bilibili Less: navigation check failed', error);
  }
}
const navigationFilter = { url: [{ hostEquals: 'bilibili.com' }, { hostSuffix: '.bilibili.com' }] };
chrome.webNavigation.onBeforeNavigate.addListener(checkNavigation, navigationFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(checkNavigation, navigationFilter);
