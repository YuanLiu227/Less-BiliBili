// Bilibili Less - Content Script
// Keeps the intentional path: following feed -> video, while hiding attention traps.

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

const MODULE_CLASS = {
  dynamic: 'bilibili-less-hide-dynamic',
  exploration: 'bilibili-less-hide-exploration',
  navigation: 'bilibili-less-hide-navigation',
  recommendations: 'bilibili-less-hide-recommendations',
  comments: 'bilibili-less-hide-comments',
  danmaku: 'bilibili-less-hide-danmaku',
  ads: 'bilibili-less-hide-ads',
  ending: 'bilibili-less-hide-ending'
};

const SEARCH_HIDDEN_CLASS = 'bilibili-less-hide-search';

const EXTENSION_CSS = `
html.bilibili-less-video-page {
  background-color: var(--bilibili-bg, #0d0d0d) !important;
}

/* Dynamic page cleanup */
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-actions,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-card .ops,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-comment,
html.bilibili-less-hide-dynamic.bilibili-less-dynamic-page .bili-dyn-list__item .bili-dyn-liked {
  display: none !important;
}

/* Search bar */
html.bilibili-less-hide-search .bili-header__search,
html.bilibili-less-hide-search .nav-search-box,
html.bilibili-less-hide-search .bili-header__bar .search-bar,
html.bilibili-less-hide-search .search-panel,
html.bilibili-less-hide-search .search-panel-popover,
html.bilibili-less-hide-search .suggest-box,
html.bilibili-less-hide-search .bili-header__bar [class*="search-bar"],
html.bilibili-less-hide-search .bili-header__bar [class*="header-search"],
html.bilibili-less-hide-search .bili-header__bar [class*="search-wrapper"] {
  display: none !important;
}

html.bilibili-less-hide-search .bili-header__bar input::placeholder,
html.bilibili-less-hide-search .bili-header__bar input::-webkit-input-placeholder {
  color: transparent !important;
}

/* Hot topics, social spread, and other exploration paths */
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page .hot-search,
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page .trending,
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page .trending-entry,
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page [class*="hot-list"],
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page [class*="sidebar-hot"],
html.bilibili-less-hide-exploration.bilibili-less-dynamic-page [class*="rank-list"],
html.bilibili-less-hide-exploration.bilibili-less-video-page a[href*="search.bilibili.com/all?keyword"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="video-tag"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="tag-panel"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="share-wrap"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="share-popover"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="video-share"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="bili-share"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="float-nav"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="elevator"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="backtop"],
html.bilibili-less-hide-exploration.bilibili-less-video-page [class*="customer"],
html.bilibili-less-hide-exploration.bilibili-less-space-page a[href*="/relation/follow"],
html.bilibili-less-hide-exploration.bilibili-less-space-page a[href*="/relation/fans"],
html.bilibili-less-hide-exploration.bilibili-less-space-page [class*="watchlater"],
html.bilibili-less-hide-exploration.bilibili-less-space-page [class*="watch-later"],
html.bilibili-less-hide-exploration.bilibili-less-space-page [class*="later-watch"] {
  display: none !important;
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
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__channel,
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar .nav-container,
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar .header-nav,
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar .nav-link,
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="header-nav"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="channel-menu"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="nav-menu"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="channel-link"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="channel-item"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="menu-link"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="menu-item"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="header-link"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="header-item"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="top-nav"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="top-tab"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="main-nav"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="primary-nav"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="sub-nav"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="link-item"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="tab-link"],
html.bilibili-less-hide-navigation.bilibili-less-space-page .bili-header__bar [class*="tab-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__channel,
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar .nav-container,
html.bilibili-less-hide-navigation.bilibili-less-video-page .header-nav,
html.bilibili-less-hide-navigation.bilibili-less-video-page .nav-link,
html.bilibili-less-hide-navigation.bilibili-less-video-page [class*="header-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="channel-menu"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="nav-menu"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="channel-link"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="channel-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="menu-link"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="menu-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="header-link"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="header-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="top-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="top-tab"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="main-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="primary-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="sub-nav"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="link-item"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="tab-link"],
html.bilibili-less-hide-navigation.bilibili-less-video-page .bili-header__bar [class*="tab-item"],
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
html.bilibili-less-hide-recommendations.bilibili-less-video-page .bpx-player-container [class*="related"],
html.bilibili-less-hide-recommendations.bilibili-less-space-page a[href*="/bangumi"],
html.bilibili-less-hide-recommendations.bilibili-less-space-page [class*="bangumi"],
html.bilibili-less-hide-recommendations.bilibili-less-space-page [class*="follow-season"],
html.bilibili-less-hide-recommendations.bilibili-less-space-page [class*="subscription"] {
  display: none !important;
  pointer-events: none !important;
}

/* Comments */
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-wrap,
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-container,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-area,
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-area,
html.bilibili-less-hide-comments.bilibili-less-video-page .root-reply-container,
html.bilibili-less-hide-comments.bilibili-less-video-page #comment,
html.bilibili-less-hide-comments.bilibili-less-video-page #comments,
html.bilibili-less-hide-comments.bilibili-less-video-page #bili-comments,
html.bilibili-less-hide-comments.bilibili-less-video-page .bili-comments,
html.bilibili-less-hide-comments.bilibili-less-video-page .comments-container,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-container,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-wrapper,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-panel,
html.bilibili-less-hide-comments.bilibili-less-video-page .comment-list,
html.bilibili-less-hide-comments.bilibili-less-video-page .reply-list,
html.bilibili-less-hide-comments.bilibili-less-video-page bili-comments,
html.bilibili-less-hide-comments.bilibili-less-video-page bili-comment-renderer,
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="comments-container"],
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="comment-container"],
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="comment-wrapper"],
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="comment-panel"],
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="comment-list"],
html.bilibili-less-hide-comments.bilibili-less-video-page [class*="reply-list"] {
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
html.bilibili-less-hide-ads.bilibili-less-video-page [class*="promote-entry"],
html.bilibili-less-hide-ads.bilibili-less-space-page a[href*="biligame.com"],
html.bilibili-less-hide-ads.bilibili-less-space-page a[href*="live.bilibili.com"],
html.bilibili-less-hide-ads.bilibili-less-space-page [class*="game-card"],
html.bilibili-less-hide-ads.bilibili-less-space-page [class*="game-list"],
html.bilibili-less-hide-ads.bilibili-less-space-page [class*="game-entry"],
html.bilibili-less-hide-ads.bilibili-less-space-page [class*="live-room"],
html.bilibili-less-hide-ads.bilibili-less-space-page [class*="live-card"] {
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
  search: [
    '.bili-header__search',
    '.nav-search-box',
    '.bili-header__bar .search-bar',
    '.search-panel',
    '.search-panel-popover',
    '.suggest-box',
    '.bili-header__bar [class*="search-bar"]',
    '.bili-header__bar [class*="header-search"]',
    '.bili-header__bar [class*="search-wrapper"]'
  ],
  dynamic: [
    '.bili-dyn-actions',
    '.bili-dyn-comment',
    '.bili-dyn-liked'
  ],
  exploration: [
    '.bilibili-less-dynamic-page .hot-search',
    '.bilibili-less-dynamic-page .trending',
    '.bilibili-less-dynamic-page [class*="hot-list"]',
    '.bilibili-less-dynamic-page [class*="hot-search"]',
    '.bilibili-less-dynamic-page [class*="rank-list"]',
    '.bilibili-less-video-page a[href*="search.bilibili.com/all?keyword"]',
    '.bilibili-less-video-page [class*="video-tag"]',
    '.bilibili-less-video-page [class*="tag-panel"]',
    '.bilibili-less-video-page [class*="share-wrap"]',
    '.bilibili-less-video-page [class*="share-popover"]',
    '.bilibili-less-video-page [class*="video-share"]',
    '.bilibili-less-video-page [class*="bili-share"]',
    '.bilibili-less-video-page [class*="float-nav"]',
    '.bilibili-less-video-page [class*="elevator"]',
    '.bilibili-less-video-page [class*="backtop"]',
    '.bilibili-less-video-page [class*="customer"]',
    '.bilibili-less-space-page a[href*="/relation/follow"]',
    '.bilibili-less-space-page a[href*="/relation/fans"]',
    '.bilibili-less-space-page [class*="watchlater"]',
    '.bilibili-less-space-page [class*="watch-later"]',
    '.bilibili-less-space-page [class*="later-watch"]'
  ],
  navigation: [
    '.bilibili-less-dynamic-page .bili-header__channel',
    '.bilibili-less-dynamic-page .bili-header__bar .nav-container',
    '.bilibili-less-dynamic-page [class*="header-nav"]',
    '.bilibili-less-dynamic-page [class*="channel-menu"]',
    '.bilibili-less-dynamic-page [class*="nav-menu"]',
    '.bilibili-less-dynamic-page [class*="nav-link"]',
    '.bilibili-less-dynamic-page [class*="nav-item"]',
    '.bilibili-less-video-page .bili-header__channel',
    '.bilibili-less-video-page .bili-header__bar .nav-container',
    '.bilibili-less-video-page .bili-header__bar [class*="header-nav"]',
    '.bilibili-less-video-page .bili-header__bar [class*="channel-menu"]',
    '.bilibili-less-video-page .bili-header__bar [class*="nav-menu"]',
    '.bilibili-less-video-page .bili-header__bar [class*="nav-link"]',
    '.bilibili-less-video-page .bili-header__bar [class*="nav-item"]',
    '.bilibili-less-space-page .bili-header__channel',
    '.bilibili-less-space-page .bili-header__bar .nav-container',
    '.bilibili-less-space-page .bili-header__bar [class*="header-nav"]',
    '.bilibili-less-space-page .bili-header__bar [class*="channel-menu"]',
    '.bilibili-less-space-page .bili-header__bar [class*="nav-menu"]',
    '.bilibili-less-space-page .bili-header__bar [class*="nav-link"]',
    '.bilibili-less-space-page .bili-header__bar [class*="nav-item"]'
  ],
  recommendations: [
    '.recommend-list',
    '.recommend-list-v1',
    '.recommend-list-v2',
    '.rec-list',
    '.v-recommend-inline-player',
    '.video-card-ad-small',
    'html.bilibili-less-video-page .bpx-player-container [class*="related"]',
    '.bilibili-less-space-page a[href*="/bangumi"]',
    '.bilibili-less-space-page [class*="bangumi"]',
    '.bilibili-less-space-page [class*="follow-season"]',
    '.bilibili-less-space-page [class*="subscription"]'
  ],
  comments: [
    '.reply-wrap',
    '.reply-container',
    '.comment-area',
    '.reply-area',
    '.root-reply-container',
    '#comment',
    '#comments',
    '#bili-comments',
    '.bili-comments',
    '.comments-container',
    '.comment-container',
    '.comment-wrapper',
    '.comment-panel',
    '.comment-list',
    '.reply-list',
    'bili-comments',
    'bili-comment-renderer',
    '[class*="comments-container"]',
    '[class*="comment-container"]',
    '[class*="comment-wrapper"]',
    '[class*="comment-panel"]',
    '[class*="comment-list"]',
    '[class*="reply-list"]'
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
    '[class*="promote-entry"]',
    '.bilibili-less-space-page a[href*="biligame.com"]',
    '.bilibili-less-space-page a[href*="live.bilibili.com"]',
    '.bilibili-less-space-page [class*="game-card"]',
    '.bilibili-less-space-page [class*="game-list"]',
    '.bilibili-less-space-page [class*="game-entry"]',
    '.bilibili-less-space-page [class*="live-room"]',
    '.bilibili-less-space-page [class*="live-card"]'
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

  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page', 'bilibili-less-space-page');
  if (hostname === 't.bilibili.com') html.classList.add('bilibili-less-dynamic-page');
  if (hostname === 'www.bilibili.com' && path.startsWith('/video/')) {
    html.classList.add('bilibili-less-video-page');
  }
  if (hostname === 'space.bilibili.com') html.classList.add('bilibili-less-space-page');
}

function updateModuleClasses() {
  const html = document.documentElement;
  Object.entries(MODULE_CLASS).forEach(([module, className]) => {
    html.classList.toggle(className, isModuleEnabled(module));
  });
  html.classList.toggle(SEARCH_HIDDEN_CLASS, currentSettings.enabled !== false && currentSettings.modules?.search === false);
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
  if (module === 'search') {
    if (currentSettings.enabled === false || currentSettings.modules?.search !== false) return;
  } else if (!isModuleEnabled(module)) {
    return;
  }

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
  const isSpace = hostname === 'space.bilibili.com';

  updatePageClasses();
  updateModuleClasses();
  if (!isDynamic && !isVideo && !isSpace) return;

  if (isDynamic) saveBgColor();
  const shouldCleanNavigation = (isDynamic || isVideo || isSpace) && isModuleEnabled('navigation');
  if (shouldCleanNavigation) hideNavTextItems();
  if (shouldCleanNavigation) hideLogoDropdown();
  if ((isDynamic || isVideo || isSpace) && isModuleEnabled('exploration')) hideTooltips();

  Object.keys(MODULE_SELECTORS).forEach(hideSelectorsForModule);
  if (isVideo && isModuleEnabled('exploration')) hideVideoExplorationByContent();
  if (isSpace) hideSpaceDistractionsByContent();
  if (isVideo && isModuleEnabled('comments')) hideCommentSectionsByContent();
  updateAutoplayGuards(isVideo);
}

function getCommentSectionContainer(source) {
  let current = source;
  let best = null;

  while (current && current !== document.body && current !== document.documentElement) {
    try {
      if (current.querySelector?.('.bpx-player-container, #bilibili-player, video, .video-info-container, .video-toolbar')) {
        break;
      }

      const rect = current.getBoundingClientRect();
      const style = getComputedStyle(current);
      const isLayoutBox = rect.width >= 420 &&
        rect.height >= 70 &&
        style.display !== 'contents' &&
        style.position !== 'fixed';

      if (isLayoutBox) best = current;
    } catch (e) {}
    current = current.parentElement;
  }

  return best || source.closest?.('section, article, div') || source.parentElement;
}

function hideCommentSectionsByContent() {
  const commentHints = ['评论', '最热', '最新', '回复', '唠会嗑'];

  try {
    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(input => {
      const text = [
        input.getAttribute('placeholder'),
        input.getAttribute('aria-label'),
        input.getAttribute('title'),
        input.textContent
      ].filter(Boolean).join(' ');

      if (commentHints.some(hint => text.includes(hint))) {
        const target = getCommentSectionContainer(input);
        if (target) hideElement(target);
      }
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim();
        return text === '评论' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!element) continue;
      const target = getCommentSectionContainer(element);
      const sectionText = target?.textContent || '';
      if (target && (sectionText.includes('最热') || sectionText.includes('最新') || sectionText.includes('回复'))) {
        hideElement(target);
      }
    }
  } catch (e) {}
}

function getSectionContainer(source) {
  let current = source;
  let best = null;

  while (current && current !== document.body && current !== document.documentElement) {
    try {
      const rect = current.getBoundingClientRect();
      const style = getComputedStyle(current);
      const isLayoutBox = rect.width >= 180 &&
        rect.height >= 32 &&
        style.display !== 'contents' &&
        style.position !== 'fixed';

      if (isLayoutBox) best = current;
      if (current.tagName === 'SECTION' || current.tagName === 'ASIDE' || current.tagName === 'ARTICLE') break;
    } catch (e) {}
    current = current.parentElement;
  }

  return best || source.closest?.('section, aside, article, div') || source.parentElement;
}

function hideClickableTextItems(root, texts) {
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim();
        return texts.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      const target = element?.closest?.('a, button, li, [role="button"], [class*="item"], [class*="entry"]');
      if (target) hideElement(target);
    }
  } catch (e) {}
}

function hideSectionsWithText(root, texts) {
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim() || '';
        return texts.some(item => text === item || text.includes(item))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!element) continue;
      const target = getSectionContainer(element);
      if (target) hideElement(target);
    }
  } catch (e) {}
}

function hideVideoExplorationByContent() {
  hideClickableTextItems(document.body, [
    '动态',
    '微信',
    'QQ',
    'QQ空间',
    '微博',
    '贴吧',
    '嵌入代码',
    '新版反馈',
    '客服',
    '顶部'
  ]);
}

function hideSpaceDistractionsByContent() {
  if (isModuleEnabled('exploration')) {
    hideClickableTextItems(document.body, ['关注数', '粉丝数', '稍后再看']);
  }

  if (isModuleEnabled('recommendations')) {
    hideSectionsWithText(document.body, ['订阅追番', '追番追剧']);
  }

  if (isModuleEnabled('ads')) {
    hideSectionsWithText(document.body, ['最近玩过的游戏', '直播间', '前往TA的直播间']);
  }
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

  disableAutoplayControlsByContent();
}

function disableAutoplayControlsByContent() {
  hideClickableTextItems(document.body, ['自动连播', '自动开播', '下一个']);

  try {
    document.querySelectorAll(
      '[class*="autoplay"], [class*="auto-play"], [class*="next-button"], [class*="next-btn"], [aria-label*="自动连播"], [aria-label*="下一个"]'
    ).forEach(el => {
      const text = [
        el.textContent,
        el.getAttribute('aria-label'),
        el.getAttribute('title')
      ].filter(Boolean).join(' ');

      if (!/(自动连播|自动开播|下一个)/.test(text) && !/(autoplay|auto-play|next)/i.test(el.className || '')) return;

      if ('checked' in el) el.checked = false;
      if (el.getAttribute('aria-checked') === 'true') el.setAttribute('aria-checked', 'false');
      hideElement(el);
    });
  } catch (e) {}
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
           path.startsWith('/space/') ||
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

function applySettings(nextSettings) {
  currentSettings = mergeSettings(nextSettings || {});
  restoreAll();

  if (currentSettings.enabled === false || isCurrentUrlWhitelisted()) {
    pauseExtension();
    return;
  }

  if (!isAllowedPage()) {
    window.location.href = 'https://t.bilibili.com';
    return;
  }

  resumeExtension();
  cleanup();
}

function pauseExtension() {
  const html = document.documentElement;
  html.classList.add('bilibili-less-paused');
  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page', 'bilibili-less-space-page');
  Object.values(MODULE_CLASS).forEach(className => html.classList.remove(className));
  html.classList.remove(SEARCH_HIDDEN_CLASS);
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
  applySettings(changes.settings.newValue || {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'BILIBILI_LESS_APPLY_SETTINGS') return;
  applySettings(message.settings || {});
  sendResponse({ ok: true });
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

  if (!isAllowedPage()) {
    window.location.href = 'https://t.bilibili.com';
    return;
  }

  resumeExtension();
}

updatePageClasses();

injectCSS();
if (document.body) init();
else document.addEventListener('DOMContentLoaded', init);
