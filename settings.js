// Shared defaults and URL policy for the worker, content script and settings UI.
(() => {
  if (globalThis.BilibiliLessSettings) return;
  const DEFAULT_MODULES = Object.freeze({
    dynamic: true, search: true, exploration: true, navigation: true,
    recommendations: true, comments: true, danmaku: true, ads: true,
    ending: true, autoplay: true, redirect: true
  });
  const MODULE_RULESETS = Object.freeze({
    recommendations: ['ruleset_recommendations'],
    exploration: ['ruleset_exploration'],
    ads: ['ruleset_ads']
  });
  const FEED_URL = 'https://t.bilibili.com/';
  const CONTENT_HOSTS = ['t.bilibili.com', 'www.bilibili.com', 'space.bilibili.com', 'search.bilibili.com'];
  const isBilibiliHost = host => host === 'bilibili.com' || host.endsWith('.bilibili.com');

  function validateWhitelistPattern(pattern) {
    try {
      const url = new URL(pattern);
      return ['http:', 'https:'].includes(url.protocol) && isBilibiliHost(url.hostname) &&
        !url.hostname.includes('*') && !url.username && !url.password && !url.port &&
        pattern.length <= 500 && !/\s/.test(pattern);
    } catch { return false; }
  }

  function parseWhitelist(text) {
    const patterns = [...new Set(text.split('\n').map(line => line.trim()).filter(Boolean))];
    const invalid = patterns.find(pattern => !validateWhitelistPattern(pattern));
    if (invalid) throw new Error(`请填写完整的 B 站网址，通配符只能放在路径中：${invalid}`);
    if (patterns.length > 100) throw new Error('最多保存 100 个例外页面。');
    return [...new Set(patterns.map(normalizePattern))];
  }

  function normalizePattern(pattern) {
    const url = new URL(pattern);
    url.hash = '';
    return url.href;
  }

  function mergeSettings(value = {}) {
    const modules = Object.fromEntries(Object.keys(DEFAULT_MODULES)
      .map(key => [key, value?.modules?.[key] !== false]));
    const patterns = value?.whitelist?.allowedUrls;
    return {
      enabled: value?.enabled !== false,
      modules,
      whitelist: { allowedUrls: Array.isArray(patterns)
        ? [...new Set(patterns.filter(pattern => typeof pattern === 'string' && validateWhitelistPattern(pattern)).map(normalizePattern))].slice(0, 100)
        : [] }
    };
  }

  function wildcardSource(pattern) {
    return '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  }

  function isUrlWhitelisted(rawUrl, settings) {
    try {
      const url = new URL(rawUrl);
      return settings.whitelist.allowedUrls.some(pattern => {
        if (new URL(pattern).origin !== url.origin) return false;
        return new RegExp(wildcardSource(pattern)).test(rawUrl);
      });
    } catch { return false; }
  }

  function isModuleEnabled(settings, module) {
    return settings.enabled && settings.modules[module] !== false;
  }

  function shouldRedirectUrl(rawUrl, settings) {
    if (!isModuleEnabled(settings, 'redirect') || isUrlWhitelisted(rawUrl, settings)) return false;
    try {
      const url = new URL(rawUrl);
      if (!['http:', 'https:'].includes(url.protocol) || !isBilibiliHost(url.hostname)) return false;
      if (['t.bilibili.com', 'space.bilibili.com', 'passport.bilibili.com', 'account.bilibili.com'].includes(url.hostname)) return false;
      if (url.hostname === 'search.bilibili.com') {
        return !isModuleEnabled(settings, 'search') || !url.searchParams.get('keyword')?.trim();
      }
      if (url.hostname !== 'www.bilibili.com') return true;
      return !/^\/(video\/|bangumi\/play\/|space\/|history(?:\/|$)|account\/history(?:\/|$)|account\/fav(?:\/|$)|list\/watchlater(?:\/|$))/.test(url.pathname);
    } catch { return false; }
  }

  function getEnabledRulesets(settings) {
    return Object.entries(MODULE_RULESETS).filter(([module]) => isModuleEnabled(settings, module))
      .flatMap(([, ids]) => ids);
  }

  globalThis.BilibiliLessSettings = Object.freeze({
    DEFAULT_MODULES, MODULE_RULESETS, FEED_URL, CONTENT_HOSTS, mergeSettings,
    isBilibiliHost, isModuleEnabled, isUrlWhitelisted, shouldRedirectUrl,
    parseWhitelist, wildcardSource, getEnabledRulesets
  });
})();
