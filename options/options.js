// Bilibili Less - Options page

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

let settings = null;
let statusTimer = null;

function mergeSettings(value = {}) {
  return {
    ...DEFAULTS,
    ...value,
    modules: {
      ...DEFAULT_MODULES,
      ...(value.modules || {})
    },
    whitelist: {
      ...DEFAULTS.whitelist,
      ...(value.whitelist || {})
    }
  };
}

function getEnabledRulesets(value) {
  if (value.enabled === false) return [];
  return Object.entries(MODULE_RULESETS)
    .filter(([module]) => value.modules[module] !== false)
    .flatMap(([, rulesets]) => rulesets);
}

async function syncNetRules(value) {
  const enableRulesetIds = getEnabledRulesets(value);
  const disableRulesetIds = ALL_RULESETS.filter(id => !enableRulesetIds.includes(id));
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds,
    disableRulesetIds
  });
}

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  return mergeSettings(result.settings || {});
}

function showStatus(text) {
  const status = document.getElementById('save-status');
  status.textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.textContent = '已同步';
  }, 1400);
}

function render(value) {
  document.getElementById('enabled').checked = value.enabled !== false;
  Object.entries(MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).checked = value.modules[module] !== false;
  });
  document.querySelectorAll('.preset-button').forEach(button => {
    button.classList.toggle('active', button.dataset.preset === value.preset);
  });
  document.getElementById('whitelist-allowed-urls').value =
    (value.whitelist.allowedUrls || []).join('\n');
}

async function save(nextSettings) {
  settings = mergeSettings(nextSettings);
  await chrome.storage.local.set({ settings });
  await syncNetRules(settings);
  render(settings);
  showStatus('已保存');
}

function readWhitelistTextarea() {
  return document.getElementById('whitelist-allowed-urls')
    .value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

document.addEventListener('DOMContentLoaded', async () => {
  settings = await loadSettings();
  render(settings);

  document.getElementById('enabled').addEventListener('change', async event => {
    await save({ ...settings, enabled: event.target.checked });
  });

  document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', async () => {
      const preset = button.dataset.preset;
      await save({
        ...settings,
        enabled: true,
        preset,
        modules: { ...PRESETS[preset] }
      });
    });
  });

  Object.entries(MODULE_INPUTS).forEach(([module, inputId]) => {
    document.getElementById(inputId).addEventListener('change', async event => {
      await save({
        ...settings,
        preset: 'custom',
        modules: {
          ...settings.modules,
          [module]: event.target.checked
        }
      });
    });
  });

  document.getElementById('save-whitelist').addEventListener('click', async () => {
    await save({
      ...settings,
      whitelist: {
        ...settings.whitelist,
        allowedUrls: readWhitelistTextarea()
      }
    });
  });
});
