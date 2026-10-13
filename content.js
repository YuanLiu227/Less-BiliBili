// Bilibili Less - Content Script
// Keeps the intentional path: following feed -> video, while hiding attention traps.

(() => {
if (globalThis.__bilibiliLessLoaded) return;
globalThis.__bilibiliLessLoaded = true;
const { mergeSettings, isUrlWhitelisted, shouldRedirectUrl, FEED_URL } = globalThis.BilibiliLessSettings;

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
html.bilibili-less-hide-exploration.bilibili-less-space-page a[href*="/relation/fans"] {
  display: none !important;
}

/* Hide channel menus; preserve search, following, history and account controls. */
html.bilibili-less-hide-navigation .bili-header__channel,
html.bilibili-less-hide-navigation .bili-header__bar .channel-menu {
  display: none !important;
}

/* Suggestions are not a search request. Keep actual query results and filters. */
html.bilibili-less-hide-exploration .bili-header__bar .search-panel,
html.bilibili-less-hide-exploration .bili-header__bar .search-panel-popover,
html.bilibili-less-hide-exploration .bili-header__bar .suggest-box,
html.bilibili-less-hide-exploration .nav-search-box .search-panel,
html.bilibili-less-hide-exploration .nav-search-box .suggestion,
html.bilibili-less-hide-exploration.bilibili-less-search-page .trending,
html.bilibili-less-hide-exploration.bilibili-less-search-page .hot-search,
html.bilibili-less-hide-exploration.bilibili-less-search-page .search-recommend,
html.bilibili-less-hide-exploration.bilibili-less-search-page .suggestion,
html.bilibili-less-hide-exploration.bilibili-less-search-page .search-suggest,
html.bilibili-less-hide-exploration.bilibili-less-search-page .suggest-wrap,
html.bilibili-less-hide-exploration.bilibili-less-search-page .search-header .search-panel,
html.bilibili-less-hide-exploration.bilibili-less-search-page .search-header .search-panel-popover,
html.bilibili-less-hide-recommendations.bilibili-less-dynamic-page .bili-dyn-up-recommend,
html.bilibili-less-hide-recommendations.bilibili-less-dynamic-page .bili-dyn-recommend,
html.bilibili-less-hide-recommendations.bilibili-less-dynamic-page .bili-dyn-topic:not(.bili-dyn-list__item .bili-dyn-topic),
html.bilibili-less-hide-recommendations.bilibili-less-dynamic-page .bili-dyn-live-users,
html.bilibili-less-hide-recommendations.bilibili-less-dynamic-page .bili-dyn-sidebar__recommend {
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
    '.bilibili-less-space-page a[href*="/relation/fans"]'
  ],
  navigation: [
    '.bili-header__channel',
    '.bili-header__bar .channel-menu'
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

const hiddenElements = new Set();
const hiddenElementStyles = new Map();
let currentSettings = mergeSettings();
let styleElement = null;
let observer = null;
let cleanupTimer = null;
let settingsReady = false;
const autoplayHandlers = new Map();
const searchPlaceholders = new Map();
let autoplayControlAttempts = new WeakSet();
const disabledAutoplayControls = new Set();

function isModuleEnabled(name) {
  return currentSettings.enabled !== false && currentSettings.modules?.[name] !== false;
}

function isCurrentUrlWhitelisted() {
  return isUrlWhitelisted(window.location.href, currentSettings);
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

  html.classList.toggle('bilibili-less-dynamic-page', hostname === 't.bilibili.com');
  html.classList.toggle('bilibili-less-video-page', hostname === 'www.bilibili.com' && (path.startsWith('/video/') || path.startsWith('/bangumi/play/')));
  html.classList.toggle('bilibili-less-space-page', hostname === 'space.bilibili.com' || (hostname === 'www.bilibili.com' && path.startsWith('/space/')));
  html.classList.toggle('bilibili-less-search-page', hostname === 'search.bilibili.com');
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
      displayPriority: el.style.getPropertyPriority('display'),
      pointerEvents: el.style.pointerEvents,
      pointerEventsPriority: el.style.getPropertyPriority('pointer-events')
    });
  }
  if (el.style.display !== 'none') el.style.setProperty('display', 'none', 'important');
  if (el.style.pointerEvents !== 'none') el.style.setProperty('pointer-events', 'none', 'important');
  hiddenElements.add(el);
}

function restoreAll() {
  hiddenElements.forEach(el => {
    try {
      const previous = hiddenElementStyles.get(el);
      el.style.setProperty('display', previous?.display || '', previous?.displayPriority || '');
      el.style.setProperty('pointer-events', previous?.pointerEvents || '', previous?.pointerEventsPriority || '');
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
  const isVideo = hostname === 'www.bilibili.com' && (path.startsWith('/video/') || path.startsWith('/bangumi/play/'));
  const isSpace = hostname === 'space.bilibili.com' || (hostname === 'www.bilibili.com' && path.startsWith('/space/'));
  const isSearch = hostname === 'search.bilibili.com';

  updatePageClasses();
  updateModuleClasses();
  if (!isDynamic && !isVideo && !isSpace && !isSearch) return;
  hiddenElements.forEach(el => {
    if (!el.isConnected) { hiddenElements.delete(el); hiddenElementStyles.delete(el); }
  });

  const shouldCleanNavigation = isModuleEnabled('navigation');
  if (shouldCleanNavigation) hideNavTextItems();
  if (shouldCleanNavigation) hideLogoDropdown();
  if (isModuleEnabled('exploration')) cleanSearchSuggestions();

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
      if (current.querySelector('video, h1, a[href*="/video/"], .video-info-container')) break;
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

  return best || source;
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
      if (target && !target.closest('.video-desc, .video-intro, .video-info-container, [class*="video-description"]')) hideElement(target);
    }
  } catch (e) {}
}

function hideSectionsWithText(root, texts) {
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim() || '';
        return texts.includes(text)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!element) continue;
      if (!element.closest('h2, h3, h4, h5, h6, [class*="section-title"], [class*="block-title"]')) continue;
      if (element.closest('a[href*="/video/"], [class*="video-card"], [class*="video-list"]')) continue;
      const target = getSectionContainer(element);
      if (target) hideElement(target);
    }
  } catch (e) {}
}

function hideVideoExplorationByContent() {
  hideClickableTextItems(document.body, [
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
    hideClickableTextItems(document.body, ['粉丝数']);
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
    if (!autoplayHandlers.has(video)) autoplayHandlers.set(video, {
      autoplay: video.autoplay, attribute: video.getAttribute('autoplay')
    });
    video.autoplay = false;
    video.removeAttribute('autoplay');
  });
  autoplayHandlers.forEach((value, video) => { if (!video.isConnected) autoplayHandlers.delete(video); });
  document.addEventListener('ended', stopAtVideoEnd, true);
  disableAutoplayControlsByContent();
}

function stopAtVideoEnd(event) {
  if (event.target?.tagName !== 'VIDEO' || !isModuleEnabled('autoplay') || isCurrentUrlWhitelisted()) return;
  event.stopImmediatePropagation();
  event.target.pause();
}

function disableAutoplayControlsByContent() {
  hideClickableTextItems(document.body, ['自动连播', '自动开播']);

  try {
    document.querySelectorAll(
      '[class*="autoplay"], [class*="auto-play"], [aria-label*="自动连播"], [aria-label*="自动开播"]'
    ).forEach(el => {
      const text = [
        el.textContent,
        el.getAttribute('aria-label'),
        el.getAttribute('title')
      ].filter(Boolean).join(' ');

      if (!/(自动连播|自动开播)/.test(text) && !/(autoplay|auto-play)/i.test(el.className || '')) return;

      const control = el.matches('input, [role="switch"], [role="checkbox"]') ? el
        : el.querySelector('input[type="checkbox"], [role="switch"], [role="checkbox"], .switch-button') || el;
      const active = isAutoplayControlOn(control) || isAutoplayControlOn(el);
      // Click the real switch so the player's state changes, not just its appearance.
      if (active && !autoplayControlAttempts.has(el) && /(autoplay|auto-play|自动连播|自动开播)/i.test(`${el.className} ${text}`)) {
        autoplayControlAttempts.add(el);
        control.click();
        disabledAutoplayControls.add(control);
      }
      hideElement(el);
    });
  } catch (e) {}
}

function isAutoplayControlOn(control) {
  return control.checked === true || control.getAttribute('aria-checked') === 'true' ||
    control.getAttribute('aria-pressed') === 'true' ||
    /(?:^|\s)(?:on|active|checked|is-checked|is-active)(?:\s|$)/.test(control.className || '');
}

function detachAutoplayGuards() {
  document.removeEventListener('ended', stopAtVideoEnd, true);
  disabledAutoplayControls.forEach(control => {
    if (control.isConnected && !isAutoplayControlOn(control)) control.click();
  });
  disabledAutoplayControls.clear();
  autoplayHandlers.forEach((previous, video) => {
    try {
      video.autoplay = previous.autoplay;
      if (previous.attribute === null) video.removeAttribute('autoplay');
      else video.setAttribute('autoplay', previous.attribute);
    } catch (e) {}
  });
  autoplayHandlers.clear();
  autoplayControlAttempts = new WeakSet();
}

function scheduleCleanup() {
  if (cleanupTimer !== null) return;
  cleanupTimer = setTimeout(() => { cleanupTimer = null; cleanup(); }, 100);
}

function startObserver() {
  if (observer) observer.disconnect();
  if (!document.body) return;
  observer = new MutationObserver(scheduleCleanup);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'aria-checked', 'aria-pressed', 'autoplay'] });
}

const NAV_TEXTS = ['首页', '番剧', '直播', '游戏中心', '会员购', '漫画', '赛事', '大会', '创作中心'];

function hideNavTextItems() {
  try {
    const headerArea = document.querySelector('.bili-header__bar, .mini-header, header, nav');
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
    const header = document.querySelector('.bili-header__bar, .mini-header, header, nav');
    if (!header) return;

    const logoLink = header.querySelector(
      'a[href*="bilibili.com"], a[href="/"], a[class*="logo"], a[class*="brand"], a[class*="home-link"]'
    );
    if (!logoLink || !logoLink.parentElement) return;

    Array.from(logoLink.parentElement.children).forEach(child => {
      if (child === logoLink || child.contains(logoLink)) return;
      const hasIcon = child.querySelector('svg, img, i, [class*="icon"]');
      const isSmall = child.getBoundingClientRect().width < 60;
      if (hasIcon && isSmall && child.tagName === 'BUTTON' && !child.querySelector('input')) {
        hideElement(child);
      }
    });
  } catch (e) {}
}

function cleanSearchSuggestions() {
  searchPlaceholders.forEach((value, input) => { if (!input.isConnected) searchPlaceholders.delete(input); });
  document.querySelectorAll('.bili-header__bar input, .nav-search-input, .search-input-el, .search-input')
    .forEach(input => {
      if (input.tagName !== 'INPUT') return;
      if (!searchPlaceholders.has(input)) searchPlaceholders.set(input, input.getAttribute('placeholder'));
      if (input.getAttribute('placeholder') !== '搜索你想看的内容') input.setAttribute('placeholder', '搜索你想看的内容');
    });
}

function guardEmptyNativeSearch(event) {
  if (!isModuleEnabled('exploration') || isCurrentUrlWhitelisted()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const wrapper = target.closest('.nav-search-box, .bili-header__search, .search-input-wrap, .search-bar');
  if (!wrapper) return;
  const input = wrapper.querySelector('input');
  if (!input || input.value.trim()) return;
  const isSearchAction = (event.type === 'keydown' && event.key === 'Enter' && target === input) ||
    (event.type === 'click' && target.closest('.nav-search-btn, .search-btn, .search-button, button[type="submit"]')) ||
    event.type === 'submit';
  if (!isSearchAction) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  input.focus();
}
['keydown', 'click', 'submit'].forEach(type => document.addEventListener(type, guardEmptyNativeSearch, true));

function restoreSearchPlaceholders() {
  searchPlaceholders.forEach((value, input) => {
    if (value === null) input.removeAttribute('placeholder');
    else input.setAttribute('placeholder', value);
  });
  searchPlaceholders.clear();
}

function isAllowedPage() {
  return !shouldRedirectUrl(window.location.href, currentSettings);
}

function setupSpaHandler() {
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    restoreAll();
    restoreSearchPlaceholders();
    if (!isAllowedPage()) { window.location.replace(FEED_URL); return; }
    if (currentSettings.enabled !== false && !isCurrentUrlWhitelisted()) resumeExtension();
    else pauseExtension();
  };

  window.addEventListener('popstate', checkUrlChange);
  // Content scripts have an isolated history object. A cheap URL check also
  // handles in-site navigation, including leaving a whitelisted page.
  setInterval(checkUrlChange, 800);
}

function applySettings(nextSettings) {
  currentSettings = mergeSettings(nextSettings || {});
  restoreAll();
  restoreSearchPlaceholders();

  if (currentSettings.enabled === false || isCurrentUrlWhitelisted()) {
    pauseExtension();
    return;
  }

  if (!isAllowedPage()) {
    window.location.replace(FEED_URL);
    return;
  }

  resumeExtension();
}

function pauseExtension() {
  const html = document.documentElement;
  html.classList.add('bilibili-less-paused');
  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page', 'bilibili-less-space-page', 'bilibili-less-search-page');
  Object.values(MODULE_CLASS).forEach(className => html.classList.remove(className));
  html.classList.remove(SEARCH_HIDDEN_CLASS);
  removeCSS();
  restoreAll();
  restoreSearchPlaceholders();
  detachAutoplayGuards();
  if (observer) observer.disconnect();
  clearTimeout(cleanupTimer);
  cleanupTimer = null;
}

function resumeExtension() {
  document.documentElement.classList.remove('bilibili-less-paused');
  injectCSS();
  cleanup();
  startObserver();
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
  settingsReady = true;

  setupSpaHandler();

  if (currentSettings.enabled === false || isCurrentUrlWhitelisted()) {
    pauseExtension();
    return;
  }

  if (!isAllowedPage()) {
    window.location.replace(FEED_URL);
    return;
  }

  resumeExtension();
}

// Read preferences at document_start so distractions can be hidden before the
// site renders; wait for the body only when attaching its mutation observer.
init();
document.addEventListener('DOMContentLoaded', () => {
  if (settingsReady && currentSettings.enabled && !isCurrentUrlWhitelisted()) resumeExtension();
});
})();
