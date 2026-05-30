// Bilibili Less - Service Worker
// Keeps page redirects and network rules in sync with the modular settings.

const DEFAULT_MODULES = {
  dynamic: true,
  search: true,
  exploration: true,
  navigation: true,
  recommendations: true,
  comments: true,
  danmaku: true,
  ads: true,
  ending: true,
  autoplay: true,
  redirect: true
};

const DEFAULT_SETTINGS = {
  enabled: true,
  modules: { ...DEFAULT_MODULES },
  whitelist: {
    allowedUrls: []
  }
};

const MODULE_RULESETS = {
  recommendations: ['ruleset_recommendations'],
  exploration: ['ruleset_exploration'],
  ads: ['ruleset_ads']
};

const ALL_RULESETS = Object.values(MODULE_RULESETS).flat();

const ALLOWED_FULL_HOSTS = new Set([
  't.bilibili.com',
  'passport.bilibili.com',
  'space.bilibili.com',
  'account.bilibili.com',
]);

const ALLOWED_PATH_RULES = [
  { host: 'www.bilibili.com', prefix: '/video/' },
  { host: 'www.bilibili.com', prefix: '/space/' },
  { host: 'www.bilibili.com', prefix: '/history' },
  { host: 'www.bilibili.com', prefix: '/account/history' }
];

const SEARCH_HOSTS = new Set([
  'search.bilibili.com'
]);

const CONTENT_SCRIPT_HOSTS = new Set([
  't.bilibili.com',
  'space.bilibili.com',
  'www.bilibili.com'
]);

function mergeSettings(settings = {}) {
  const normalized = { ...settings };
  delete normalized.preset;

  return {
    ...DEFAULT_SETTINGS,
    ...normalized,
    modules: {
      ...DEFAULT_MODULES,
      ...(normalized.modules || {})
    },
    whitelist: {
      ...DEFAULT_SETTINGS.whitelist,
      ...(normalized.whitelist || {})
    }
  };
}

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return mergeSettings(result.settings || {});
}

function isModuleEnabled(settings, module) {
  return settings.enabled !== false && settings.modules?.[module] !== false;
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\*/g, '.*')}`);
}

function isUrlWhitelisted(url, settings) {
  const patterns = settings.whitelist?.allowedUrls || [];
  return patterns.some(pattern => {
    if (!pattern || typeof pattern !== 'string') return false;
    try {
      return pattern.includes('*')
        ? wildcardToRegExp(pattern).test(url)
        : url.startsWith(pattern);
    } catch (e) {
      return false;
    }
  });
}

function getEnabledRulesets(settings) {
  if (settings.enabled === false) return [];
  return Object.entries(MODULE_RULESETS)
    .filter(([module]) => isModuleEnabled(settings, module))
    .flatMap(([, rulesets]) => rulesets);
}

function getRulesetSignature(settings) {
  return getEnabledRulesets(settings).slice().sort().join('|');
}

function didNetworkRulesChange(previousSettings, nextSettings) {
  return getRulesetSignature(previousSettings) !== getRulesetSignature(nextSettings);
}

async function syncNetRules() {
  try {
    const settings = await getSettings();
    const enableRulesetIds = getEnabledRulesets(settings);
    const disableRulesetIds = ALL_RULESETS.filter(id => !enableRulesetIds.includes(id));
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds,
      disableRulesetIds
    });
  } catch (e) {
    console.warn('Bilibili Less: failed to sync network rules', e);
  }
}

function shouldRedirectUrl(rawUrl, settings) {
  if (!isModuleEnabled(settings, 'redirect')) return false;
  if (isUrlWhitelisted(rawUrl, settings)) return false;

  let url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    return false;
  }

  if (!url.hostname.endsWith('bilibili.com')) return false;
  if (ALLOWED_FULL_HOSTS.has(url.hostname)) return false;
  if (SEARCH_HOSTS.has(url.hostname) && isModuleEnabled(settings, 'search')) return false;

  return !ALLOWED_PATH_RULES.some(rule =>
    url.hostname === rule.host && url.pathname.startsWith(rule.prefix)
  );
}

function canInjectContentScript(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return CONTENT_SCRIPT_HOSTS.has(url.hostname);
  } catch (e) {
    return false;
  }
}

function canReloadTab(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.endsWith('bilibili.com');
  } catch (e) {
    return false;
  }
}

async function applySettingsToTab(tab, settings, options = {}) {
  if (!tab.id || !tab.url) return;

  if (shouldRedirectUrl(tab.url, settings)) {
    await chrome.tabs.update(tab.id, { url: 'https://t.bilibili.com' });
    return;
  }

  if (options.reloadAfterApply && canReloadTab(tab.url)) {
    await chrome.tabs.reload(tab.id);
    return;
  }

  if (!canInjectContentScript(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'BILIBILI_LESS_APPLY_SETTINGS',
      settings
    });
  } catch (e) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (injectError) {
      console.warn('Bilibili Less: failed to inject content script', injectError);
    }
  }
}

async function applySettingsToOpenTabs(settings, options = {}) {
  try {
    const tabs = await chrome.tabs.query({ url: ['*://*.bilibili.com/*'] });
    await Promise.all(tabs.map(tab => applySettingsToTab(tab, settings, options)));
  } catch (e) {
    console.warn('Bilibili Less: failed to apply settings to open tabs', e);
  }
}

chrome.runtime.onStartup.addListener(syncNetRules);
chrome.runtime.onInstalled.addListener(syncNetRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  const previousSettings = mergeSettings(changes.settings.oldValue || {});
  const settings = mergeSettings(changes.settings.newValue || {});

  (async () => {
    await syncNetRules();
    await applySettingsToOpenTabs(settings, {
      reloadAfterApply: didNetworkRulesChange(previousSettings, settings)
    });
  })();
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  let settings;
  try {
    settings = await getSettings();
  } catch (e) {
    settings = mergeSettings();
  }

  if (shouldRedirectUrl(details.url, settings)) {
    chrome.tabs.update(details.tabId, { url: 'https://t.bilibili.com' });
  }
});
