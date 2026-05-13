// Bilibili Less - Content Script
// Keeps the intentional path: following feed -> video, while hiding attention traps.

const DEFAULT_MODULES = {
  dynamic: true,
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

const MODULE_CLASS = {
  dynamic: 'bilibili-less-hide-dynamic',
  navigation: 'bilibili-less-hide-navigation',
  recommendations: 'bilibili-less-hide-recommendations',
  comments: 'bilibili-less-hide-comments',
  danmaku: 'bilibili-less-hide-danmaku',
  ads: 'bilibili-less-hide-ads',
  ending: 'bilibili-less-hide-ending'
};

const EXTENSION_CSS = `
html.bilibili-less-video-page {
  background-color: var(--bilibili-bg, #0d0d0d) !important;
}

/* Dynamic page cleanup */
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-header__search,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .nav-search-box,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-header__bar .search-bar,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .search-panel,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .search-panel-popover,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .suggest-box,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .hot-search,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .trending,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .trending-entry,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-header__channel,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-header__bar .nav-container,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="search-bar"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="header-search"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="search-wrapper"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="hot-list"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="sidebar-hot"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page [class*="rank-list"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-actions,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-card .ops,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-comment,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-liked,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item[data-type="2"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item[data-type="4"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item[data-type="8"],
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item:has([data-type="goods"]) {
  display: none !important;
}

html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page input::placeholder,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page input::-webkit-input-placeholder {
  color: transparent !important;
}

/* Navigation entry cleanup */
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="header-nav"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="channel-menu"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="nav-menu"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="nav-link"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="nav-item"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="channel-link"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="channel-item"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="menu-link"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="menu-item"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="header-link"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="header-item"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="top-nav"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="top-tab"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="main-nav"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="primary-nav"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="sub-nav"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="link-item"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="tab-link"],
html.bilibili-less-hide-navigation.bilibili-less-dynamic-page [class*="tab-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__channel,
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar .nav-container,
html.bilibili-less-hide-navigation.bilibili-less-video-page .header-nav,
html.bilibili-less-hide-navigation.bilibili-less-video-page .nav-link,
html.bilibili-less-hide-navigation.bilibili-less-video-page [class*="header-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page [class*="nav-link"],
html.bilibili-less-hide-navigation.bilibili-less-video-page [class*="nav-item"] {
  display: none !important;
}

/* Recommendations */
html.bilibili-less-hide-recommendations.bilibili-less-video-page .recommend-list,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .recommend-list-v1,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .recommend-list-v2,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .rec-list,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .v-recommend-inline-player,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .video-card-ad-small,
html.bilibili-less-hide-recommendations.bilibili-less-video-page .bpx-player-container [class*="related"] {
  display: none !important;
  pointer-events: none !important;
}

/* Comments */
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-wrap,
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-container,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-area,
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-area,
html.bilibili-less-hide-comments.bilibili-less-video-page .root-reply-container {
  display: none !important;
}

/* Danmaku */
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-player-danmaku,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-danmaku-container,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .danmaku-container,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-player-control-dm,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-player-dm-switch,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-player-dm-input,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .bpx-player-dm-input-wrap,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .danmaku-list,
html.bilibili-less-hide-danmaku.bilibili-less-video-page .dm-list,
html.bilibili-less-hide-danmaku.bilibili-less-video-page [class*="danmaku-list"],
html.bilibili-less-hide-danmaku.bilibili-less-video-page [class*="dm-list"] {
  display: none !important;
}

/* Ads and promotions */
html.bilibili-less-hide-ads .bili-dyn-banner,
html.bilibili-less-hide-ads .banner-wrap,
html.bilibili-less-hide-ads .home-tips-con,
html.bilibili-less-hide-ads .bili-banner,
html.bilibili-less-hide-ads .popularize,
html.bilibili-less-hide-ads .download-entry,
html.bilibili-less-hide-ads .download-tips,
html.bilibili-less-hide-ads .app-download-tip,
html.bilibili-less-hide-ads .bili-header__download,
html.bilibili-less-hide-ads .live-room,
html.bilibili-less-hide-ads .live-up-card,
html.bilibili-less-hide-ads .goods-container,
html.bilibili-less-hide-ads .ad-report,
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="broadcast"],
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="notice-bar"],
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="announce"],
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="activity-entry"],
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="activity-panel"],
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="promote-entry"] {
  display: none !important;
}

/* Ending recommendations */
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-ending,
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-ending-related,
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-ending-content,
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-ending-countdown,
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-ending-more,
html.bilibili-less-hide-ending.bilibili-less-video-page .bpx-player-container [class*="ending"] {
  display: none !important;
  pointer-events: none !important;
}

html.bilibili-less-hide-dynamic .bili-header__bar .msg-num,
html.bilibili-less-hide-dynamic .bili-header__bar .notice-num {
  display: none !important;
}

.bpx-player-container {
  width: 100% !important;
  max-width: 100% !important;
}
`;

const MODULE_SELECTORS = {
  dynamic: [
    '.bili-header__search',
    '.nav-search-box',
    '.search-panel',
    '.search-panel-popover',
    '[class*="search-bar"]',
    '[class*="header-search"]',
    '[class*="search-wrapper"]',
    '.hot-search',
    '.trending',
    '[class*="hot-list"]',
    '[class*="hot-search"]',
    '[class*="rank-list"]',
    '.bili-dyn-actions',
    '.bili-dyn-comment',
    '.bili-dyn-liked'
  ],
  navigation: [
    '[class*="header-nav"]',
    '[class*="channel-menu"]',
    '[class*="nav-menu"]'
  ],
  recommendations: [
    '.recommend-list',
    '.recommend-list-v1',
    '.recommend-list-v2',
    '.rec-list',
    '.v-recommend-inline-player',
    '.video-card-ad-small',
    'html.bilibili-less-video-page .bpx-player-container [class*="related"]'
  ],
  comments: [
    '.reply-wrap',
    '.reply-container',
    '.comment-area',
    '.reply-area',
    '.root-reply-container'
  ],
  danmaku: [
    '.bpx-player-danmaku',
    '.bpx-danmaku-container',
    '.danmaku-container',
    '.bpx-player-control-dm',
    '.bpx-player-dm-switch',
    '.bpx-player-dm-input',
    '.bpx-player-dm-input-wrap',
    '.danmaku-list',
    '.dm-list',
    '[class*="danmaku-list"]',
    '[class*="dm-list"]'
  ],
  ads: [
    '.bili-dyn-banner',
    '.banner-wrap',
    '.home-tips-con',
    '.bili-banner',
    '.popularize',
    '.download-entry',
    '.download-tips',
    '.app-download-tip',
    '.bili-header__download',
    '.live-room',
    '.live-up-card',
    '.goods-container',
    '.ad-report',
    '[class*="broadcast"]',
    '[class*="notice-bar"]',
    '[class*="announce"]',
    '[class*="activity-entry"]',
    '[class*="activity-panel"]',
    '[class*="promote-entry"]'
  ],
  ending: [
    '.bpx-player-ending',
    '.bpx-player-ending-related',
    '.bpx-player-ending-content',
    '.bpx-player-ending-countdown',
    '.bpx-player-ending-more',
    'html.bilibili-less-video-page .bpx-player-container [class*="ending"]'
  ]
};

const BG_COLOR_KEY = 'bilibiliLessBg';
const hiddenElements = new Set();
const hiddenElementStyles = new Map();
let currentSettings = { ...DEFAULT_SETTINGS, modules: { ...DEFAULT_MODULES } };
let styleElement = null;
let observer = null;
let cleanInterval = null;
const autoplayHandlers = new Map();

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

function isModuleEnabled(name) {
  return currentSettings.enabled !== false && currentSettings.modules?.[name] !== false;
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\*/g, '.*')}`);
}

function isCurrentUrlWhitelisted() {
  const url = window.location.href;
  const patterns = currentSettings.whitelist?.allowedUrls || [];
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

function injectCSS() {
  if (styleElement) return;
  styleElement = document.createElement('style');
  styleElement.id = 'bilibili-less-style';
  styleElement.textContent = EXTENSION_CSS;
  document.documentElement.appendChild(styleElement);
}

function removeCSS() {
  if (!styleElement) return;
  styleElement.remove();
  styleElement = null;
}

function updatePageClasses() {
  const html = document.documentElement;
  const hostname = window.location.hostname;
  const path = window.location.pathname;

  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page');
  if (hostname === 't.bilibili.com') html.classList.add('bilibili-less-dynamic-page');
  if (hostname === 'www.bilibili.com' && path.startsWith('/video/')) {
    html.classList.add('bilibili-less-video-page');
  }
}

function updateModuleClasses() {
  const html = document.documentElement;
  Object.entries(MODULE_CLASS).forEach(([module, className]) => {
    html.classList.toggle(className, isModuleEnabled(module));
  });
}

function hideElement(el) {
  if (!hiddenElementStyles.has(el)) {
    hiddenElementStyles.set(el, {
      display: el.style.display,
      pointerEvents: el.style.pointerEvents
    });
  }
  el.style.display = 'none';
  el.style.pointerEvents = 'none';
  hiddenElements.add(el);
}

function restoreAll() {
  hiddenElements.forEach(el => {
    try {
      const previous = hiddenElementStyles.get(el);
      el.style.display = previous?.display || '';
      el.style.pointerEvents = previous?.pointerEvents || '';
    } catch (e) {}
  });
  hiddenElements.clear();
  hiddenElementStyles.clear();
}

function hideSelectorsForModule(module) {
  if (!isModuleEnabled(module)) return;
  (MODULE_SELECTORS[module] || []).forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(hideElement);
    } catch (e) {}
  });
}

function cleanup() {
  if (currentSettings.enabled === false) return;
  if (isCurrentUrlWhitelisted()) {
    pauseExtension();
    return;
  }

  const hostname = window.location.hostname;
  const path = window.location.pathname;
  const isDynamic = hostname === 't.bilibili.com';
  const isVideo = hostname === 'www.bilibili.com' && path.startsWith('/video/');

  updatePageClasses();
  updateModuleClasses();
  if (!isDynamic && !isVideo) return;

  if (isDynamic) saveBgColor();
  if (isDynamic && isModuleEnabled('navigation')) hideNavTextItems();
  if (isDynamic && isModuleEnabled('navigation')) hideLogoDropdown();
  if (isDynamic && isModuleEnabled('dynamic')) hideTooltips();

  Object.keys(MODULE_SELECTORS).forEach(hideSelectorsForModule);
  updateAutoplayGuards(isVideo);
}

function updateAutoplayGuards(isVideo) {
  if (!isVideo || !isModuleEnabled('autoplay')) {
    detachAutoplayGuards();
    return;
  }

  document.querySelectorAll('video').forEach(video => {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    if (autoplayHandlers.has(video)) return;

    const handler = event => {
      video.autoplay = false;
      video.pause();
      event.stopImmediatePropagation();
    };
    video.addEventListener('ended', handler, true);
    autoplayHandlers.set(video, handler);
  });
}

function detachAutoplayGuards() {
  autoplayHandlers.forEach((handler, video) => {
    try {
      video.removeEventListener('ended', handler, true);
    } catch (e) {}
  });
  autoplayHandlers.clear();
}

function startObserver() {
  if (observer) observer.disconnect();
  if (!document.body) return;
  observer = new MutationObserver(() => cleanup());
  observer.observe(document.body, { childList: true, subtree: true });
}

function saveBgColor() {
  if (window.location.hostname !== 't.bilibili.com') return;
  try {
    const color = getComputedStyle(document.body).backgroundColor;
    if (color && color !== 'rgba(0,0,0,0)' && color !== 'transparent') {
      chrome.storage.local.set({ [BG_COLOR_KEY]: color });
    }
  } catch (e) {}
}

async function applyBgColor() {
  if (window.location.hostname !== 'www.bilibili.com' ||
      !window.location.pathname.startsWith('/video/')) return;
  try {
    const result = await chrome.storage.local.get(BG_COLOR_KEY);
    if (result[BG_COLOR_KEY]) {
      document.documentElement.style.setProperty('--bilibili-bg', result[BG_COLOR_KEY]);
    }
  } catch (e) {}
}

const NAV_TEXTS = ['首页', '番剧', '直播', '游戏中心', '会员购', '漫画', '赛事', '大会', '创作中心'];

function hideNavTextItems() {
  try {
    const headerArea = document.querySelector(
      '[class*="header"], [class*="nav"], [class*="channel"], nav, header'
    );
    if (!headerArea) return;

    NAV_TEXTS.forEach(text => {
      const iter = document.createTreeWalker(headerArea, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = iter.nextNode())) {
        if (node.textContent.trim() !== text) continue;
        let target = node.parentElement;
        while (target && target !== headerArea) {
          if (target.tagName === 'A' || target.tagName === 'LI' ||
              getComputedStyle(target).cursor === 'pointer') {
            hideElement(target);
            break;
          }
          target = target.parentElement;
        }
      }
    });
  } catch (e) {}
}

function hideLogoDropdown() {
  try {
    const header = document.querySelector('[class*="header"], [class*="nav"], nav, header');
    if (!header) return;

    const logoLink = header.querySelector(
      'a[href*="bilibili.com"], a[href="/"], a[class*="logo"], a[class*="brand"], a[class*="home-link"]'
    );
    if (!logoLink || !logoLink.parentElement) return;

    Array.from(logoLink.parentElement.children).forEach(child => {
      if (child === logoLink || child.contains(logoLink)) return;
      const hasIcon = child.querySelector('svg, img, i, [class*="icon"]');
      const isSmall = child.getBoundingClientRect().width < 60;
      if (hasIcon && (child.tagName === 'BUTTON' || child.tagName === 'SPAN' ||
          child.tagName === 'DIV' || isSmall)) {
        hideElement(child);
      }
    });
  } catch (e) {}
}

function hideTooltips() {
  try {
    document.querySelectorAll(
      'body > [class*="tooltip"], body > [class*="popup"], body > [class*="tip"], ' +
      'body > [class*="hover"], body > [class*="float"], body > [class*="overlay"], [role="tooltip"]'
    ).forEach(el => {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'absolute') hideElement(el);
    });
  } catch (e) {}
}

function isAllowedPage() {
  if (isCurrentUrlWhitelisted()) return true;
  if (currentSettings.enabled === false || !isModuleEnabled('redirect')) return true;

  const hostname = window.location.hostname;
  const path = window.location.pathname;
  if (hostname === 'www.bilibili.com') {
    return path.startsWith('/video/') ||
           path.startsWith('/history') ||
           path.startsWith('/account/history');
  }
  return true;
}

function setupSpaHandler() {
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    setTimeout(() => {
      if (currentSettings.enabled !== false && !isCurrentUrlWhitelisted()) resumeExtension();
      else pauseExtension();
      cleanup();
    }, 100);
    if (!isAllowedPage()) window.location.href = 'https://t.bilibili.com';
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    origPush.apply(this, args);
    checkUrlChange();
  };
  history.replaceState = function (...args) {
    origReplace.apply(this, args);
    checkUrlChange();
  };
  window.addEventListener('popstate', checkUrlChange);
}

function pauseExtension() {
  const html = document.documentElement;
  html.classList.add('bilibili-less-paused');
  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page');
  Object.values(MODULE_CLASS).forEach(className => html.classList.remove(className));
  removeCSS();
  restoreAll();
  detachAutoplayGuards();
  if (observer) observer.disconnect();
  if (cleanInterval) {
    clearInterval(cleanInterval);
    cleanInterval = null;
  }
}

function resumeExtension() {
  document.documentElement.classList.remove('bilibili-less-paused');
  injectCSS();
  cleanup();
  applyBgColor();
  startObserver();
  if (!cleanInterval) cleanInterval = setInterval(cleanup, 2000);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  currentSettings = mergeSettings(changes.settings.newValue || {});
  restoreAll();
  if (currentSettings.enabled === false || isCurrentUrlWhitelisted()) {
    pauseExtension();
  } else {
    resumeExtension();
  }
});

async function init() {
  try {
    const result = await chrome.storage.local.get('settings');
    currentSettings = mergeSettings(result.settings || {});
  } catch (e) {
    currentSettings = mergeSettings();
  }

  setupSpaHandler();

  if (currentSettings.enabled === false || isCurrentUrlWhitelisted()) {
    pauseExtension();
    return;
  }

  resumeExtension();
}

if (window.location.hostname === 't.bilibili.com') {
  document.documentElement.classList.add('bilibili-less-dynamic-page');
}

injectCSS();
if (document.body) init();
else document.addEventListener('DOMContentLoaded', init);
