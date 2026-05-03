// Bilibili Less - Popup

const DEFAULTS = {
  enabled: true
};

// 加载设置并更新UI
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };

  document.getElementById('enabled').checked = settings.enabled;
  updateStatus(settings.enabled);
}

// 更新状态显示
function updateStatus(enabled) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  dot.className = 'status-dot' + (enabled ? '' : ' off');
  text.textContent = enabled ? '运行中' : '已暂停';
}

// 控制 API 拦截规则的开关
async function toggleNetRules(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['ruleset_1']
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ['ruleset_1']
      });
    }
  } catch (e) {
    console.error('Failed to toggle net rules:', e);
  }
}

// 保存设置
async function saveSetting(key, value) {
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };
  settings[key] = value;
  await chrome.storage.local.set({ settings });

  // 同步开关 API 拦截规则
  await toggleNetRules(settings.enabled);

  updateStatus(settings.enabled);
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  // 初始同步：确保规则集状态与设置一致
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };
  await toggleNetRules(settings.enabled);

  document.getElementById('enabled').addEventListener('change', async (e) => {
    await saveSetting('enabled', e.target.checked);
  });
});
