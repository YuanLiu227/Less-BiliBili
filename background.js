// Bilibili Less - Service Worker
// 功能：页面重定向 —— 只允许访问动态页、视频页、历史记录、收藏

const ALLOWED_FULL_HOSTS = new Set([
  't.bilibili.com',
  'passport.bilibili.com',
  'space.bilibili.com',
]);

const ALLOWED_PATH_RULES = [
  { host: 'www.bilibili.com', prefix: '/video/' },
  { host: 'www.bilibili.com', prefix: '/history' },
  { host: 'www.bilibili.com', prefix: '/account/history' },
];

// 启动时同步 API 拦截规则状态
async function syncNetRules() {
  try {
    const result = await chrome.storage.local.get('settings');
    const enabled = result.settings?.enabled !== false;
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['ruleset_1'] });
    }
  } catch (e) {}
}
chrome.runtime.onStartup.addListener(syncNetRules);
chrome.runtime.onInstalled.addListener(syncNetRules);

// 监听设置变化同步规则
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  syncNetRules();
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  // 暂停状态不拦截任何导航
  try {
    const result = await chrome.storage.local.get('settings');
    if (result.settings?.enabled === false) return;
  } catch (e) {}

  const url = new URL(details.url);
  if (!url.hostname.endsWith('bilibili.com')) return;

  // 整站放行（任何路径）
  if (ALLOWED_FULL_HOSTS.has(url.hostname)) return;

  // 路径前缀匹配
  for (const rule of ALLOWED_PATH_RULES) {
    if (url.hostname === rule.host && url.pathname.startsWith(rule.prefix)) {
      return;
    }
  }

  // 不匹配 → 重定向到动态页
  chrome.tabs.update(details.tabId, { url: 'https://t.bilibili.com' });
});
