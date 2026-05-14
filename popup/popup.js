// Bilibili Less - Popup

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

const DEFAULTS = {
  enabled: true,
  preset: 'focus',
  modules: { ...DEFAULT_MODULES },
  whitelist: {
    allowedUrls: []
  }
};

const PRESETS = {
  gentle: {
    dynamic: false,
    exploration: false,
    navigation: false,
    recommendations: true,
    comments: false,
    danmaku: false,
    ads: true,
    ending: true,
    autoplay: false,
    redirect: false
  },
  focus: {
    ...DEFAULT_MODULES
  },
  strict: {
    ...DEFAULT_MODULES
  }
};

const MODULE_INPUTS = {
  dynamic: 'module-dynamic',
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

const MODULE_RULESETS = {
  recommendations: ['ruleset_recommendations'],
  exploration: ['ruleset_exploration'],
  dynamic: ['ruleset_dynamic'],
  ads: ['ruleset_ads']
};

const ALL_RULESETS = Object.values(MODULE_RULESETS).flat();

function mergeSettings(settings = {}) {
  return {
    ...DEFAULTS,
    ...settings,
    modules: {
      ...DEFAULT_MODULES,
      ...(settings.modules || {})
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
  Object.entries(MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).checked = settings.modules[module] !== false;
  });
  document.querySelectorAll('.preset-button').forEach(button => {
    button.classList.toggle('active', button.dataset.preset === settings.preset);
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

  document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', async () => {
      const preset = button.dataset.preset;
      settings = mergeSettings({
        ...settings,
        enabled: true,
        preset,
        modules: { ...PRESETS[preset] }
      });
      await saveSettings(settings);
    });
  });

  Object.entries(MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).addEventListener('change', async (event) => {
      settings = mergeSettings({
        ...settings,
        preset: 'custom',
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
