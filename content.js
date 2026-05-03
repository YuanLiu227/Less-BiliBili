// ============================================
// Bilibili Less - Content Script
// 功能：动态元素清理 + SPA监听
// CSS 由 JS 动态注入，支持暂停时完全移除
// ============================================

const EXTENSION_CSS = `/* ============================================
   Bilibili Less - Static CSS
   由 content.js 在 document_start 动态注入
   ============================================ */

/* ======== 动态页 (t.bilibili.com) ======== */

/* 搜索栏容器 - 精确类名 */
.bili-header__search,
.nav-search-box,
.bili-header__bar .search-bar,
.search-panel {
  display: none !important;
}

/* 搜索建议弹出框 */
.search-panel-popover,
.suggest-box {
  display: none !important;
}

/* 热搜列表 */
.hot-search,
.trending,
.trending-entry {
  display: none !important;
}

/* 顶部导航栏 */
.bili-header__channel,
.bili-header__bar .nav-container {
  display: none !important;
}

/* ===== 动态页专用宽泛匹配（限定作用域，不泄漏到其他页面） ===== */

/* 搜索栏/导航/热搜 - 宽泛匹配当前B站CSS Modules类名 */
html.bilibili-less-dynamic-page [class*="search-bar"],
html.bilibili-less-dynamic-page [class*="header-search"],
html.bilibili-less-dynamic-page [class*="search-wrapper"] {
  display: none !important;
}

html.bilibili-less-dynamic-page [class*="hot-list"],
html.bilibili-less-dynamic-page [class*="sidebar-hot"],
html.bilibili-less-dynamic-page [class*="rank-list"] {
  display: none !important;
}

html.bilibili-less-dynamic-page [class*="header-nav"],
html.bilibili-less-dynamic-page [class*="channel-menu"],
html.bilibili-less-dynamic-page [class*="nav-menu"],
html.bilibili-less-dynamic-page [class*="nav-link"],
html.bilibili-less-dynamic-page [class*="nav-item"],
html.bilibili-less-dynamic-page [class*="channel-link"],
html.bilibili-less-dynamic-page [class*="channel-item"],
html.bilibili-less-dynamic-page [class*="menu-link"],
html.bilibili-less-dynamic-page [class*="menu-item"],
html.bilibili-less-dynamic-page [class*="header-link"],
html.bilibili-less-dynamic-page [class*="header-item"],
html.bilibili-less-dynamic-page [class*="top-nav"],
html.bilibili-less-dynamic-page [class*="top-tab"],
html.bilibili-less-dynamic-page [class*="main-nav"],
html.bilibili-less-dynamic-page [class*="primary-nav"],
html.bilibili-less-dynamic-page [class*="sub-nav"],
html.bilibili-less-dynamic-page [class*="link-item"],
html.bilibili-less-dynamic-page [class*="tab-link"],
html.bilibili-less-dynamic-page [class*="tab-item"] {
  display: none !important;
}

/* logo旁的下拉触发器 */
html.bilibili-less-dynamic-page [class*="logo"] [class*="arrow"],
html.bilibili-less-dynamic-page [class*="logo"] [class*="trigger"],
html.bilibili-less-dynamic-page [class*="logo"] [class*="expand"],
html.bilibili-less-dynamic-page [class*="brand"] [class*="arrow"],
html.bilibili-less-dynamic-page [class*="brand"] [class*="trigger"],
html.bilibili-less-dynamic-page [class*="brand"] [class*="expand"] {
  display: none !important;
}

/* 悬停弹出框/提示框（不隐藏按钮本身） */
html.bilibili-less-dynamic-page [role="tooltip"],
html.bilibili-less-dynamic-page [class*="tooltip"],
html.bilibili-less-dynamic-page [class*="hover-pop"],
html.bilibili-less-dynamic-page [class*="hover-box"],
html.bilibili-less-dynamic-page [class*="hover-card"],
html.bilibili-less-dynamic-page [class*="popup-box"],
html.bilibili-less-dynamic-page [class*="tip-box"],
html.bilibili-less-dynamic-page [class*="hover-tip"],
html.bilibili-less-dynamic-page [class*="hover-panel"],
html.bilibili-less-dynamic-page [class*="float-tip"],
html.bilibili-less-dynamic-page [class*="float-pop"],
html.bilibili-less-dynamic-page [class*="overlay-tip"] {
  display: none !important;
}

/* 搜索栏内提示词/占位符清除 */
html.bilibili-less-dynamic-page input::placeholder,
html.bilibili-less-dynamic-page input::-webkit-input-placeholder {
  color: transparent !important;
}

/* 通知小红点 - 精确选择 */
.bili-header__bar .msg-num,
.bili-header__bar .notice-num {
  display: none !important;
}

/* 横幅广告/推广 */
.bili-dyn-banner,
.banner-wrap,
.home-tips-con,
.bili-banner,
.popularize {
  display: none !important;
}

/* 下载客户端提示 */
.download-entry,
.download-tips,
.app-download-tip,
.bili-header__download {
  display: none !important;
}

/* 动态卡片内部操作按钮栏 - 精确子元素选择 */
.bili-dyn-list__item .bili-dyn-actions,
.bili-dyn-card .ops {
  display: none !important;
}

/* 动态卡片评论预览区域 */
.bili-dyn-list__item .bili-dyn-comment {
  display: none !important;
}

/* 社交证明：X人觉得很赞等 */
.bili-dyn-list__item .bili-dyn-liked {
  display: none !important;
}

/* 非视频动态类型过滤（data-type 属性选择） */
.bili-dyn-list__item[data-type="2"],
.bili-dyn-list__item[data-type="4"],
.bili-dyn-list__item[data-type="8"] {
  display: none !important;
}

/* 带商品/广告标记的动态 */
.bili-dyn-list__item:has([data-type="goods"]) {
  display: none !important;
}

/* ======== 视频页 (www.bilibili.com/video/*) ======== */

/* 视频信息区域 */
.video-info-container,
.video-title,
.video-data,
.up-info-container,
.video-attr {
  display: none !important;
}

/* 点赞/投币/收藏/分享 */
.video-toolbar,
.video-toolbar-left,
.video-toolbar-right {
  display: none !important;
}

/* 右侧推荐列表 */
.recommend-list,
.recommend-list-v1,
.recommend-list-v2,
.video-page-aside,
.aside-container {
  display: none !important;
}

/* 评论区 */
.reply-wrap,
.reply-container,
.comment-area,
.reply-area,
.root-reply-container {
  display: none !important;
}

/* 视频结束覆盖层 */
.bpx-player-ending,
.bpx-player-ending-related,
.bpx-player-ending-content,
.bpx-player-ending-countdown,
.bpx-player-ending-more {
  display: none !important;
}

/* 视频描述/标签 */
.video-desc,
.video-description,
.video-tag,
.tag-container {
  display: none !important;
}

/* 弹幕层 */
.bpx-player-danmaku,
.bpx-danmaku-container,
.danmaku-container {
  display: none !important;
}

/* 弹幕设置/开关 */
.bpx-player-control-dm,
.bpx-player-dm-switch {
  display: none !important;
}

/* 播放列表/合集 */
.video-playlist,
.playlist-container {
  display: none !important;
}

/* 直播推荐 */
.live-room,
.live-up-card {
  display: none !important;
}

/* 商品/推广 */
.goods-container {
  display: none !important;
}

/* 弹幕输入框 */
.bpx-player-dm-input,
.bpx-player-dm-input-wrap {
  display: none !important;
}

/* ---- 限制视频尺寸调节：只允许全屏和真全屏 ---- */

/* 隐藏宽屏模式按钮 */
.bpx-player-ctrl-wide {
  display: none !important;
}

/* 隐藏小窗播放按钮 */
.bpx-player-ctrl-mini {
  display: none !important;
}

/* 播放器容器最大化（正常文档流内最大化） */
.bpx-player-container {
  width: 100% !important;
  max-width: 100% !important;
}

/* ======== 视频页额外隐藏元素（仅在视频页生效）======= */

/* 顶部导航栏：首页/番剧/直播/活动等链接 */
html.bilibili-less-video-page .bili-header__channel,
html.bilibili-less-video-page .bili-header__bar .nav-container,
html.bilibili-less-video-page .header-nav,
html.bilibili-less-video-page .nav-link,
html.bilibili-less-video-page [class*="header-nav"],
html.bilibili-less-video-page [class*="nav-link"],
html.bilibili-less-video-page [class*="nav-item"] {
  display: none !important;
}

/* 右侧弹幕列表面板 */
html.bilibili-less-video-page .danmaku-list,
html.bilibili-less-video-page .dm-list,
html.bilibili-less-video-page [class*="danmaku-list"],
html.bilibili-less-video-page [class*="dm-list"] {
  display: none !important;
}

/* 视频下方广播/公告 */
html.bilibili-less-video-page [class*="broadcast"],
html.bilibili-less-video-page [class*="notice-bar"],
html.bilibili-less-video-page [class*="announce"] {
  display: none !important;
}

/* 视频下方活动/推广 */
html.bilibili-less-video-page [class*="activity-entry"],
html.bilibili-less-video-page [class*="activity-panel"],
html.bilibili-less-video-page [class*="promote-entry"] {
  display: none !important;
}

/* ======== visibility 兜底：隐藏所有非播放器内容 ======== */
html.bilibili-less-video-page {
  background-color: var(--bilibili-bg, #0d0d0d) !important;
}

html.bilibili-less-video-page body {
  visibility: hidden !important;
}

html.bilibili-less-video-page .bpx-player-container,
html.bilibili-less-video-page .bpx-player-container * {
  visibility: visible !important;
}

/* 已在 display:none 中隐藏的播放器子元素保持不变 */
html.bilibili-less-video-page .bpx-player-danmaku,
html.bilibili-less-video-page .bpx-danmaku-container,
html.bilibili-less-video-page .danmaku-container,
html.bilibili-less-video-page .bpx-player-dm-input,
html.bilibili-less-video-page .bpx-player-dm-input-wrap,
html.bilibili-less-video-page .bpx-player-ending {
  display: none !important;
}
`;

// ---- CSS 注入/移除 ----
let styleElement = null;

function injectCSS() {
  if (styleElement) return;
  styleElement = document.createElement('style');
  styleElement.id = 'bilibili-less-style';
  styleElement.textContent = EXTENSION_CSS;
  document.documentElement.appendChild(styleElement);
}

function removeCSS() {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

// 文档解析前注入 CSS，防 FOUC
injectCSS();

// Bilibili Less - Content Script
// 功能：动态元素清理 + SPA监听
// ============================================

const DISTRACTION_SELECTORS = [
  // === 动态页：搜索栏 ===
  '.bili-header__search',
  '.nav-search-box',
  '.search-panel',
  '.search-panel-popover',
  '[class*="search-bar"]',
  '[class*="header-search"]',
  '[class*="search-wrapper"]',
  // === 动态页：热搜 ===
  '.hot-search',
  '.trending',
  '[class*="hot-list"]',
  '[class*="hot-search"]',
  '[class*="rank-list"]',
  // === 动态页：导航栏 ===
  '[class*="header-nav"]',
  '[class*="channel-menu"]',
  '[class*="nav-menu"]',
  // === 动态卡片 ===
  '.bili-dyn-actions',
  '.bili-dyn-comment',
  '.bili-dyn-liked',
  // === 视频页 ===
  '.video-toolbar',
  '.recommend-list',
  '.recommend-list-v1',
  '.reply-wrap',
  '.reply-container',
  '.bpx-player-ending',
  '.bpx-player-danmaku',
  '.bpx-danmaku-container',
  '.danmaku-container',
  '.bpx-player-dm-input',
  '.video-info-container',
  '.up-info-container',
  '.video-playlist',
  '.playlist-container',
  // === 广告/推广 ===
  '.bili-dyn-banner',
  '.banner-wrap',
  // === 通知 ===
  '.bili-header__bar .msg-num',
  '.bili-header__bar .notice-num',
];

function cleanup() {
  // 暂停状态不执行任何操作
  if (document.documentElement.classList.contains('bilibili-less-paused')) return;

  const hostname = window.location.hostname;
  const path = window.location.pathname;
  const isDynamic = hostname === 't.bilibili.com';
  const isVideo = hostname === 'www.bilibili.com' && path.startsWith('/video/');
  const html = document.documentElement;

  // 更新页面标记类
  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page');
  if (isDynamic) html.classList.add('bilibili-less-dynamic-page');
  if (isVideo) html.classList.add('bilibili-less-video-page');

  if (!isDynamic && !isVideo) return;

  // 从动态页提取背景色并保存
  if (isDynamic) saveBgColor();

  // 按文本内容隐藏导航项和创作中心
  if (isDynamic) hideNavTextItems();

  // 隐藏 logo 旁的下拉框
  if (isDynamic) hideLogoDropdown();

  // 隐藏按钮悬停提示框
  if (isDynamic) hideTooltips();

  DISTRACTION_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        hideElement(el);
      });
    } catch (e) {}
  });
}

// ---- MutationObserver ----
let observer = null;
function startObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => cleanup());
  observer.observe(document.body, { childList: true, subtree: true });
}

// ---- 背景色同步 ----
// 从动态页提取 B 站实际背景色，应用到视频页
const BG_COLOR_KEY = 'bilibiliLessBg';

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

// ---- 导航项文本匹配兜底 ----
// B站CSS Modules类名频繁变化，通过文本内容查找导航项并隐藏
const NAV_TEXTS = ['首页', '番剧', '直播', '游戏中心', '会员购', '漫画', '赛事', '大会员', '创作中心'];

function hideNavTextItems() {
  try {
    // 在 header 或 nav 区域内查找——避免误伤动态列表中的文字
    const headerArea = document.querySelector(
      '[class*="header"], [class*="nav"], [class*="channel"], nav, header'
    );
    if (!headerArea) return;

    NAV_TEXTS.forEach(text => {
      // 遍历 header 区域内的所有文本节点
      const iter = document.createTreeWalker(headerArea, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = iter.nextNode()) {
        if (node.textContent.trim() === text) {
          let target = node.parentElement;
          // 向上找到可点击的链接或最近的块级元素
          while (target && target !== headerArea) {
            if (target.tagName === 'A' || target.tagName === 'LI' ||
                getComputedStyle(target).cursor === 'pointer') {
              hideElement(target);
              break;
            }
            target = target.parentElement;
          }
        }
      }
    });
  } catch (e) {}
}

// ---- logo旁下拉框隐藏 ----
function hideLogoDropdown() {
  try {
    // 在头部区域找到 B 站 logo 链接
    const header = document.querySelector(
      '[class*="header"], [class*="nav"], nav, header'
    );
    if (!header) return;

    const logoLink = header.querySelector(
      'a[href*="bilibili.com"], a[href="/"], ' +
      'a[class*="logo"], a[class*="brand"], ' +
      'a[class*="home-link"]'
    );
    if (!logoLink) return;

    // 从 logo 的父容器中，找到 logo 旁边的按钮/图标元素
    const parent = logoLink.parentElement;
    if (!parent) return;

    // 同一父容器下，排除 logo 本身，隐藏小而带图标的元素（即下拉触发器）
    Array.from(parent.children).forEach(child => {
      if (child === logoLink || child.contains(logoLink)) return;
      const tag = child.tagName;
      const hasIcon = child.querySelector('svg, img, i, [class*="icon"]');
      const isSmall = child.getBoundingClientRect().width < 60;
      if (hasIcon && (tag === 'BUTTON' || tag === 'SPAN' || tag === 'DIV' || isSmall)) {
        hideElement(child);
      }
    });
  } catch (e) {}
}

// ---- 悬停提示框隐藏 ----
function hideTooltips() {
  try {
    // 隐藏 B 站生成的浮层提示框（直接 append 到 body 的 fixed/absolute 小元素）
    document.querySelectorAll(
      'body > [class*="tooltip"], body > [class*="popup"], body > [class*="tip"], ' +
      'body > [class*="hover"], body > [class*="float"], body > [class*="overlay"], ' +
      '[role="tooltip"]'
    ).forEach(el => {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'absolute') {
        hideElement(el);
      }
    });
  } catch (e) {}
}

// ---- SPA导航 ----
function isAllowedPage() {
  // 暂停状态不限制导航
  if (document.documentElement.classList.contains('bilibili-less-paused')) return true;

  const hostname = window.location.hostname;
  const path = window.location.pathname;
  if (hostname === 'www.bilibili.com') {
    return path.startsWith('/video/') ||
           path.startsWith('/history') ||
           path.startsWith('/account/history');
  }
  // t.bilibili.com / space.bilibili.com / passport 全部放行
  return true;
}

function setupSpaHandler() {
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(cleanup, 100);
      // SPA跳转到非允许页面时强制重定向
      if (!isAllowedPage()) {
        window.location.href = 'https://t.bilibili.com';
      }
    }
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) { origPush.apply(this, args); checkUrlChange(); };
  history.replaceState = function (...args) { origReplace.apply(this, args); checkUrlChange(); };
  window.addEventListener('popstate', checkUrlChange);
}

// ---- 暂停/恢复 ----
// 跟踪所有由 JS 隐藏的元素，以便恢复
const hiddenElements = new Set();
let cleanInterval = null;

function hideElement(el) {
  el.style.display = 'none';
  hiddenElements.add(el);
}

function restoreAll() {
  hiddenElements.forEach(el => {
    try { el.style.display = ''; } catch (e) {}
  });
  hiddenElements.clear();
}

function restoreAndPause() {
  const html = document.documentElement;
  html.classList.add('bilibili-less-paused');
  html.classList.remove('bilibili-less-dynamic-page', 'bilibili-less-video-page');
  removeCSS(); // 移除注入的 CSS，所有元素恢复原始状态
  restoreAll();
  if (observer) observer.disconnect();
  if (cleanInterval) { clearInterval(cleanInterval); cleanInterval = null; }
  // 刷新页面确保完全恢复
  window.location.reload();
}

function removePauseAndResume() {
  document.documentElement.classList.remove('bilibili-less-paused');
  // 刷新页面，让 CSS 在 document_start 重新注入，确保功能完整生效
  window.location.reload();
}

// 监听从 popup 传来的启用状态变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  const enabled = changes.settings.newValue?.enabled;
  if (enabled === false) {
    restoreAndPause();
  } else if (enabled === true) {
    removePauseAndResume();
  }
});

// ---- 初始化 ----
async function init() {
  // 读取启用状态
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    if (settings.enabled === false) {
      removeCSS(); // 移除一开始注入的 CSS
      document.documentElement.classList.add('bilibili-less-paused');
      return; // 暂停状态，不做任何清理
    }
  } catch (e) {}

  cleanup();
  applyBgColor();
  startObserver();
  setupSpaHandler();
  cleanInterval = setInterval(cleanup, 2000);
}

// 在文档解析前添加页面标记，防止CSS作用域闪烁
if (window.location.hostname === 't.bilibili.com') {
  document.documentElement.classList.add('bilibili-less-dynamic-page');
}

if (document.body) init();
else document.addEventListener('DOMContentLoaded', init);
