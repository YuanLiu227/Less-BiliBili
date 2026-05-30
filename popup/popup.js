// Bilibili Less - Popup

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

const DEFAULTS = {
  enabled: true,
  modules: { ...DEFAULT_MODULES },
  whitelist: {
    allowedUrls: []
  }
};

const MODULE_INPUTS = {
  dynamic: 'module-dynamic',
  search: 'module-search',
  exploration: 'module-exploration',
  navigation: 'module-navigation',
  recommendations: 'module-recommendations',
  comments: 'module-comments',
  danmaku: 'module-danmaku',
  ads: 'module-ads',
  ending: 'module-ending',
  autoplay: 'module-autoplay',
  redirect: 'module-redirect'
};

const POPUP_MODULE_INPUTS = {
  search: 'module-search',
  recommendations: 'module-recommendations',
  comments: 'module-comments',
  danmaku: 'module-danmaku',
  autoplay: 'module-autoplay',
  ads: 'module-ads',
  redirect: 'module-redirect'
};

const MODULE_RULESETS = {
  recommendations: ['ruleset_recommendations'],
  exploration: ['ruleset_exploration'],
  ads: ['ruleset_ads']
};

const ALL_RULESETS = Object.values(MODULE_RULESETS).flat();

function mergeSettings(settings = {}) {
  const normalized = { ...settings };
  delete normalized.preset;

  return {
    ...DEFAULTS,
    ...normalized,
    modules: {
      ...DEFAULT_MODULES,
      ...(normalized.modules || {})
    }
  };
}

function getEnabledRulesets(settings) {
  if (settings.enabled === false) return [];
  return Object.entries(MODULE_RULESETS)
    .filter(([module]) => settings.modules[module] !== false)
    .flatMap(([, rulesets]) => rulesets);
}

async function syncNetRules(settings) {
  try {
    const enableRulesetIds = getEnabledRulesets(settings);
    const disableRulesetIds = ALL_RULESETS.filter(id => !enableRulesetIds.includes(id));
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds,
      disableRulesetIds
    });
  } catch (e) {
    console.error('Failed to sync net rules:', e);
  }
}

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  return mergeSettings(result.settings || {});
}

function render(settings) {
  document.getElementById('enabled').checked = settings.enabled !== false;
  Object.entries(POPUP_MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).checked = settings.modules[module] !== false;
  });
  updateStatus(settings.enabled !== false);
}

function updateStatus(enabled) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  dot.className = 'status-dot' + (enabled ? '' : ' off');
  text.textContent = enabled ? '正在保护浏览路径' : '已暂停，B 站恢复原样';
}

async function saveSettings(settings) {
  const merged = mergeSettings(settings);
  await chrome.storage.local.set({ settings: merged });
  await syncNetRules(merged);
  render(merged);
}

document.addEventListener('DOMContentLoaded', async () => {
  let settings = await loadSettings();
  render(settings);
  await syncNetRules(settings);

  document.getElementById('enabled').addEventListener('change', async (event) => {
    settings = mergeSettings({ ...settings, enabled: event.target.checked });
    await saveSettings(settings);
  });

  Object.entries(POPUP_MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).addEventListener('change', async (event) => {
      settings = mergeSettings({
        ...settings,
        modules: {
          ...settings.modules,
          [module]: event.target.checked
        }
      });
      await saveSettings(settings);
    });
  });

  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
