// Bilibili Less - Service Worker
// Keeps page redirects and network rules in sync with the modular settings.

const DEFAULT_MODULES = {
  dynamic: true,
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
  dynamic: ['ruleset_dynamic'],
  ads: ['ruleset_ads']
};

const ALL_RULESETS = Object.values(MODULE_RULESETS).flat();

const ALLOWED_FULL_HOSTS = new Set([
  't.bilibili.com',
  'passport.bilibili.com',
  'space.bilibili.com'
]);

const ALLOWED_PATH_RULES = [
  { host: 'www.bilibili.com', prefix: '/video/' },
  { host: 'www.bilibili.com', prefix: '/history' },
  { host: 'www.bilibili.com', prefix: '/account/history' }
];

function mergeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    modules: {
      ...DEFAULT_MODULES,
      ...(settings.modules || {})
    },
    whitelist: {
      ...DEFAULT_SETTINGS.whitelist,
      ...(settings.whitelist || {})
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

chrome.runtime.onStartup.addListener(syncNetRules);
chrome.runtime.onInstalled.addListener(syncNetRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  syncNetRules();
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  let settings;
  try {
    settings = await getSettings();
  } catch (e) {
    settings = mergeSettings();
  }

  if (!isModuleEnabled(settings, 'redirect')) return;
  if (isUrlWhitelisted(details.url, settings)) return;

  const url = new URL(details.url);
  if (!url.hostname.endsWith('bilibili.com')) return;

  if (ALLOWED_FULL_HOSTS.has(url.hostname)) return;

  for (const rule of ALLOWED_PATH_RULES) {
    if (url.hostname === rule.host && url.pathname.startsWith(rule.prefix)) {
      return;
    }
  }

  chrome.tabs.update(details.tabId, { url: 'https://t.bilibili.com' });
});
