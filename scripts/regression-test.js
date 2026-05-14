const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.BILIBILI_LESS_TEST_PORT || 9231);
const EXT_DIR = path.join(os.tmpdir(), 'LessBiliBiliRegressionExt');
const PROFILE_DIR = path.join(os.tmpdir(), 'LessBiliBiliRegressionProfile');
const VIDEO_URL = process.env.BILIBILI_LESS_TEST_VIDEO || 'https://www.bilibili.com/video/BV1Q5411w7z5/';

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

function log(message) {
  console.log(message);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log(`PASS ${message}`);
}

function assertWithDetails(condition, message, details) {
  if (condition) {
    log(`PASS ${message}`);
    return;
  }
  throw new Error(`${message}\n${JSON.stringify(details, null, 2)}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanupDir(dir) {
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) {
    throw new Error(`Refuse to clean a non-temp path: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function findBrowser() {
  const candidates = [
    process.env.BILIBILI_LESS_BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);

  const browser = candidates.find(candidate => fs.existsSync(candidate));
  if (!browser) {
    throw new Error('未找到 Edge 或 Chrome。可设置 BILIBILI_LESS_BROWSER 指向浏览器可执行文件。');
  }
  return browser;
}

function prepareExtension() {
  cleanupDir(EXT_DIR);
  cleanupDir(PROFILE_DIR);
  fs.cpSync(ROOT, EXT_DIR, {
    recursive: true,
    filter: source => {
      const relative = path.relative(ROOT, source);
      if (!relative) return true;
      const first = relative.split(path.sep)[0];
      return !['.git', 'node_modules'].includes(first);
    }
  });
}

function launchBrowser(browser) {
  const args = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    `--load-extension=${EXT_DIR}`,
    `--disable-extensions-except=${EXT_DIR}`,
    '--disable-first-run-ui',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-popup-blocking',
    '--window-size=1280,900',
    '--window-position=-32000,-32000',
    'about:blank'
  ];

  return spawn(browser, args, {
    stdio: 'ignore',
    windowsHide: true,
    detached: false
  });
}

async function waitForDebugEndpoint() {
  const endpoint = `http://127.0.0.1:${PORT}/json/version`;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch (e) {}
    await sleep(500);
  }
  throw new Error('浏览器调试端口未就绪。');
}

async function newPage(url) {
  const response = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT'
  });
  if (!response.ok) throw new Error(`无法创建测试页面: ${response.status}`);
  const target = await response.json();
  return new CDP(target.webSocketDebuggerUrl);
}

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
      this.ws.addEventListener('message', event => this.onMessage(event));
    });
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method && this.events.has(message.method)) {
      this.events.get(message.method).forEach(handler => handler(message.params || {}));
    }
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 20000);
    });
  }

  on(method, handler) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(handler);
  }

  async enablePage() {
    await this.send('Page.enable');
    await this.send('Runtime.enable');
  }

  async navigate(url, waitMs = 6000) {
    await this.send('Page.navigate', { url });
    await sleep(waitMs);
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description ||
        result.exceptionDetails.exception?.value ||
        result.exceptionDetails.text ||
        '页面脚本执行失败';
      throw new Error(detail);
    }
    return result.result.value;
  }

  close() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

function findExtensionId() {
  const securePreferences = path.join(PROFILE_DIR, 'Default', 'Secure Preferences');
  const preferences = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const files = [securePreferences, preferences];
  const normalizedExtDir = path.resolve(EXT_DIR).replaceAll('\\', '/').toLowerCase();

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const settings = data.extensions?.settings || {};
    for (const [id, value] of Object.entries(settings)) {
      const manifestName = value.manifest?.name;
      const pathValue = String(value.path || '').replaceAll('\\', '/').toLowerCase();
      if (manifestName === 'Bilibili Less' || pathValue === normalizedExtDir) return id;
    }
  }
  return null;
}

async function waitForExtensionId() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const id = findExtensionId();
    if (id) return id;
    await sleep(500);
  }
  throw new Error('未能在临时浏览器配置中找到扩展 ID。');
}

async function testPopup(extensionId) {
  const page = await newPage(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.enablePage();
  await sleep(1000);

  const result = await page.eval(`(() => {
    const ids = ['enabled', 'module-dynamic', 'module-exploration', 'module-navigation', 'module-recommendations', 'module-comments', 'module-danmaku', 'module-ads', 'module-ending', 'module-autoplay', 'module-redirect'];
    const presets = ['preset-gentle', 'preset-focus', 'preset-strict'];
    return {
      title: document.querySelector('h1')?.textContent,
      missing: ids.filter(id => !document.getElementById(id)),
      missingPresets: presets.filter(id => !document.getElementById(id)),
      activePreset: document.querySelector('.preset-button.active')?.dataset.preset,
      checked: Object.fromEntries(ids.map(id => [id, document.getElementById(id)?.checked]))
    };
  })()`);

  assert(result.title === 'Bilibili Less', 'popup 标题正确');
  assert(result.missing.length === 0, 'popup 总开关和模块开关都存在');
  assert(result.missingPresets.length === 0, 'popup 模式预设按钮都存在');
  assert(result.activePreset === 'focus', 'popup 默认高亮专注模式');
  assert(Object.values(result.checked).every(Boolean), 'popup 默认开关均为开启状态');
  page.close();
}

async function testOptionsPage(extensionId) {
  const page = await newPage(`chrome-extension://${extensionId}/options/options.html`);
  await page.enablePage();
  await sleep(1000);

  const result = await page.eval(`(() => {
    const ids = ['enabled', 'module-dynamic', 'module-exploration', 'module-navigation', 'module-recommendations', 'module-comments', 'module-danmaku', 'module-ads', 'module-ending', 'module-autoplay', 'module-redirect'];
    const presets = ['preset-gentle', 'preset-focus', 'preset-strict'];
    return {
      title: document.querySelector('h1')?.textContent,
      missing: ids.filter(id => !document.getElementById(id)),
      missingPresets: presets.filter(id => !document.getElementById(id)),
      hasWhitelist: Boolean(document.getElementById('whitelist-allowed-urls')),
      hasSave: Boolean(document.getElementById('save-whitelist'))
    };
  })()`);

  assert(result.title === 'Bilibili Less 设置', '设置页标题正确');
  assert(result.missing.length === 0, '设置页模块开关都存在');
  assert(result.missingPresets.length === 0, '设置页模式预设按钮都存在');
  assert(result.hasWhitelist, '设置页白名单输入区存在');
  assert(result.hasSave, '设置页白名单保存按钮存在');

  const storageResult = await page.eval(`(async () => {
    const textarea = document.getElementById('whitelist-allowed-urls');
    textarea.value = 'https://www.bilibili.com/v/popular';
    document.getElementById('save-whitelist').click();
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await chrome.storage.local.get('settings');
    return result.settings?.whitelist?.allowedUrls || [];
  })()`);

  assert(storageResult.includes('https://www.bilibili.com/v/popular'), '设置页可以保存白名单配置');

  await page.eval(`(async () => {
    document.getElementById('whitelist-allowed-urls').value = '';
    document.getElementById('save-whitelist').click();
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);
  page.close();
}

async function testPresetSwitching(extensionId) {
  const page = await newPage(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.enablePage();
  await sleep(1000);

  const gentle = await page.eval(`(async () => {
    document.getElementById('preset-gentle').click();
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      preset: document.querySelector('.preset-button.active')?.dataset.preset,
      comments: document.getElementById('module-comments').checked,
      danmaku: document.getElementById('module-danmaku').checked,
      autoplay: document.getElementById('module-autoplay').checked,
      exploration: document.getElementById('module-exploration').checked,
      navigation: document.getElementById('module-navigation').checked,
      recommendations: document.getElementById('module-recommendations').checked,
      ads: document.getElementById('module-ads').checked
    };
  })()`);

  assert(gentle.preset === 'gentle', '点击温和预设后温和模式高亮');
  assert(gentle.comments === false, '温和模式保留评论区');
  assert(gentle.danmaku === false, '温和模式保留弹幕功能');
  assert(gentle.autoplay === false, '温和模式不强制禁用自动连播');
  assert(gentle.exploration === false, '温和模式保留探索入口');
  assert(gentle.navigation === false, '温和模式保留导航入口');
  assert(gentle.recommendations === true, '温和模式仍隐藏推荐内容');
  assert(gentle.ads === true, '温和模式仍隐藏广告推广');

  const focus = await page.eval(`(async () => {
    document.getElementById('preset-focus').click();
    await new Promise(resolve => setTimeout(resolve, 800));
    const ids = ['enabled', 'module-dynamic', 'module-exploration', 'module-navigation', 'module-recommendations', 'module-comments', 'module-danmaku', 'module-ads', 'module-ending', 'module-autoplay', 'module-redirect'];
    return {
      preset: document.querySelector('.preset-button.active')?.dataset.preset,
      allChecked: ids.every(id => document.getElementById(id).checked)
    };
  })()`);

  assert(focus.preset === 'focus', '点击专注预设后专注模式高亮');
  assert(focus.allChecked, '专注模式恢复默认模块组合');
  page.close();
}

async function testRulesetSwitching(extensionId) {
  const page = await newPage(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.enablePage();
  await sleep(1000);

  const initialRulesets = await page.eval('chrome.declarativeNetRequest.getEnabledRulesets()');
  assert(initialRulesets.includes('ruleset_recommendations'), '推荐网络规则默认启用');
  assert(initialRulesets.includes('ruleset_exploration'), '探索入口网络规则默认启用');
  assert(initialRulesets.includes('ruleset_dynamic'), '动态网络规则默认启用');
  assert(initialRulesets.includes('ruleset_ads'), '广告网络规则默认启用');

  const afterToggle = await page.eval(`(async () => {
    const input = document.getElementById('module-recommendations');
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return chrome.declarativeNetRequest.getEnabledRulesets();
  })()`);

  assert(!afterToggle.includes('ruleset_recommendations'), '关闭推荐模块后推荐网络规则停用');
  assert(afterToggle.includes('ruleset_exploration'), '关闭推荐模块不影响探索入口网络规则');
  assert(afterToggle.includes('ruleset_dynamic'), '关闭推荐模块不影响动态网络规则');
  assert(afterToggle.includes('ruleset_ads'), '关闭推荐模块不影响广告网络规则');

  await page.eval(`(async () => {
    const input = document.getElementById('module-recommendations');
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);

  const afterExplorationToggle = await page.eval(`(async () => {
    const input = document.getElementById('module-exploration');
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return chrome.declarativeNetRequest.getEnabledRulesets();
  })()`);

  assert(!afterExplorationToggle.includes('ruleset_exploration'), '关闭探索入口模块后探索网络规则停用');
  assert(afterExplorationToggle.includes('ruleset_recommendations'), '关闭探索入口模块不影响推荐网络规则');

  await page.eval(`(async () => {
    const input = document.getElementById('module-exploration');
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);
  page.close();
}

async function testVideoPage() {
  const page = await newPage(VIDEO_URL);
  await page.enablePage();
  await sleep(15000);

  const result = await page.eval(`(() => {
    const visible = selector => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const exists = selector => Boolean(document.querySelector(selector));
    const dimensions = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        visibility: style.visibility
      };
    };
    const html = document.documentElement;
    return {
      url: location.href,
      title: document.title,
      styleInjected: Boolean(document.getElementById('bilibili-less-style')),
      isVideoPage: html.classList.contains('bilibili-less-video-page'),
      classes: Array.from(html.classList).filter(name => name.startsWith('bilibili-less-hide-')),
      bodyVisible: document.body ? getComputedStyle(document.body).visibility !== 'hidden' : false,
      playerVisible: visible('.bpx-player-container') || visible('#bilibili-player') || visible('.bpx-player-video-area') || visible('video'),
      playerExists: exists('.bpx-player-container') || exists('#bilibili-player') || exists('.bpx-player-video-area') || exists('video'),
      playerBox: dimensions('.bpx-player-container') || dimensions('#bilibili-player') || dimensions('.bpx-player-video-area') || dimensions('video'),
      titleVisible: visible('.video-title') || visible('h1'),
      actionVisible: visible('.video-toolbar') || visible('.toolbar-left') || visible('[class*="toolbar"]'),
      episodeVisible: visible('.video-pod__list') || visible('[class*="video-pod"]') || visible('[class*="multi-page"]'),
      hasVideo: Boolean(document.querySelector('video')),
      videoAutoplayOff: [...document.querySelectorAll('video')].every(video => video.autoplay === false && !video.hasAttribute('autoplay')),
      recommendationHidden: [...document.querySelectorAll('.recommend-list, .recommend-list-v1, .recommend-list-v2, .rec-list')]
        .every(el => getComputedStyle(el).display === 'none'),
      commentsHidden: [...document.querySelectorAll('.reply-wrap, .reply-container, .comment-area, .reply-area, .root-reply-container, #comment, #comments, #bili-comments, .bili-comments, .comments-container, .comment-container, .comment-wrapper, .comment-panel, .comment-list, .reply-list, bili-comments, bili-comment-renderer, [class*="comments-container"], [class*="comment-container"], [class*="comment-wrapper"], [class*="comment-panel"], [class*="comment-list"], [class*="reply-list"]')]
        .every(el => getComputedStyle(el).display === 'none')
    };
  })()`);

  assert(result.styleInjected, '视频页已注入扩展样式');
  assert(result.isVideoPage, '视频页识别 class 生效');
  assert(result.bodyVisible, '视频页 body 未被整体隐藏');
  assertWithDetails(result.playerVisible || result.playerExists, '播放器或 video 元素存在且未被扩展误删', {
    url: result.url,
    title: result.title,
    playerBox: result.playerBox
  });
  assert(result.titleVisible, '视频标题可见');
  assert(result.classes.includes('bilibili-less-hide-recommendations'), '推荐模块默认开启');
  assert(result.classes.includes('bilibili-less-hide-comments'), '评论模块默认开启');
  assert(result.classes.includes('bilibili-less-hide-danmaku'), '弹幕模块默认开启');
  assert(!result.hasVideo || result.videoAutoplayOff, '视频元素存在时 autoplay 已关闭');
  assert(result.recommendationHidden, '推荐区域存在时会被隐藏');
  assert(result.commentsHidden, '评论区域存在时会被隐藏');
  log(`INFO 视频页地址: ${result.url}`);
  log(`INFO 操作栏可见: ${result.actionVisible}`);
  log(`INFO 选集/合集可见: ${result.episodeVisible}`);

  const videoNavigationResult = await page.eval(`(async () => {
    const fake = document.createElement('header');
    fake.id = 'less-bilibili-video-navigation-test';
    fake.className = 'less-test-header';
    fake.style.cssText = 'display: block; width: 100%; min-height: 48px;';
    fake.innerHTML = '<a href="https://www.bilibili.com">Bilibili</a><nav><a id="less-test-anime" href="/anime">番剧</a><a id="less-test-creator" href="/platform">创作中心</a></nav><button id="less-test-logo-extra"><span class="icon"></span></button>';
    document.body.prepend(fake);
    await new Promise(resolve => setTimeout(resolve, 600));
    const hidden = id => getComputedStyle(document.getElementById(id)).display === 'none';
    return {
      animeHidden: hidden('less-test-anime'),
      creatorHidden: hidden('less-test-creator'),
      logoExtraHidden: hidden('less-test-logo-extra')
    };
  })()`);
  assert(videoNavigationResult.animeHidden, '视频页会隐藏与动态页一致的番剧导航入口');
  assert(videoNavigationResult.creatorHidden, '视频页会隐藏与动态页一致的创作中心导航入口');
  assert(videoNavigationResult.logoExtraHidden, '视频页会隐藏 Logo 旁的导航入口');

  const videoExplorationResult = await page.eval(`(async () => {
    const fake = document.createElement('section');
    fake.id = 'less-bilibili-video-exploration-test';
    fake.style.cssText = 'display: block; width: 760px; min-height: 120px;';
    fake.innerHTML = [
      '<a id="less-test-tag" href="https://search.bilibili.com/all?keyword=RISC-V">RISC-V</a>',
      '<button id="less-test-share">微博</button>',
      '<button id="less-test-autoplay" class="bpx-player-autoplay" aria-checked="true">自动连播</button>',
      '<button id="less-test-next" class="bpx-player-next-button">下一个</button>'
    ].join('');
    document.body.appendChild(fake);
    await new Promise(resolve => setTimeout(resolve, 700));
    const hidden = id => getComputedStyle(document.getElementById(id)).display === 'none';
    return {
      tagHidden: hidden('less-test-tag'),
      shareHidden: hidden('less-test-share'),
      autoplayHidden: hidden('less-test-autoplay'),
      nextHidden: hidden('less-test-next')
    };
  })()`);
  assert(videoExplorationResult.tagHidden, '视频页会隐藏搜索标签入口');
  assert(videoExplorationResult.shareHidden, '视频页会隐藏社交分享扩散入口');
  assert(videoExplorationResult.autoplayHidden, '视频页会隐藏自动连播控件');
  assert(videoExplorationResult.nextHidden, '视频页会隐藏下一个入口');

  const modernCommentResult = await page.eval(`(async () => {
    const fake = document.createElement('section');
    fake.id = 'less-bilibili-modern-comment-test';
    fake.style.cssText = 'width: 760px; min-height: 220px; padding: 16px;';
    fake.innerHTML = '<div><span>评论</span><span>365</span><span>最热</span><span>最新</span></div><input placeholder="进来亲和UP唠会嗑呗"><div>测试评论内容</div>';
    document.body.appendChild(fake);
    await new Promise(resolve => setTimeout(resolve, 600));
    return getComputedStyle(fake).display === 'none';
  })()`);
  assert(modernCommentResult, '新版评论区结构会被兜底隐藏');
  page.close();
}

async function testSpacePage() {
  const page = await newPage('https://space.bilibili.com/2');
  await page.enablePage();
  await sleep(8000);

  const result = await page.eval(`(() => {
    const html = document.documentElement;
    return {
      styleInjected: Boolean(document.getElementById('bilibili-less-style')),
      isSpacePage: html.classList.contains('bilibili-less-space-page'),
      classes: Array.from(html.classList).filter(name => name.startsWith('bilibili-less-hide-')),
      bodyVisible: document.body ? getComputedStyle(document.body).visibility !== 'hidden' : false,
      title: document.title
    };
  })()`);

  assert(result.styleInjected, '个人空间已注入扩展样式');
  assert(result.isSpacePage, '个人空间识别 class 生效');
  assert(result.bodyVisible, '个人空间 body 未被整体隐藏');
  assert(result.classes.includes('bilibili-less-hide-exploration'), '个人空间探索入口模块默认开启');
  assert(result.classes.includes('bilibili-less-hide-recommendations'), '个人空间推荐模块默认开启');
  assert(result.classes.includes('bilibili-less-hide-ads'), '个人空间广告推广模块默认开启');

  const spaceCleanupResult = await page.eval(`(async () => {
    const fake = document.createElement('main');
    fake.id = 'less-bilibili-space-test';
    fake.innerHTML = [
      '<section id="less-space-profile"><h1>测试UP主</h1><a href="https://www.bilibili.com/video/BV1Q5411w7z5/">测试视频</a></section>',
      '<a id="less-space-follow" href="https://space.bilibili.com/2/relation/follow">关注数422</a>',
      '<a id="less-space-fans" href="https://space.bilibili.com/2/relation/fans">粉丝数139.4万</a>',
      '<section id="less-space-bangumi"><h2>订阅追番</h2><a href="https://www.bilibili.com/bangumi/play/ss41620">番剧卡片</a></section>',
      '<section id="less-space-game"><h2>最近玩过的游戏</h2><a href="https://www.biligame.com/detail/?id=1">游戏下载</a></section>',
      '<section id="less-space-live"><h2>直播间</h2><a href="https://live.bilibili.com/1024">前往TA的直播间</a></section>'
    ].join('');
    document.body.appendChild(fake);
    await new Promise(resolve => setTimeout(resolve, 700));
    const visible = id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    return {
      profileVisible: visible('less-space-profile'),
      followHidden: !visible('less-space-follow'),
      fansHidden: !visible('less-space-fans'),
      bangumiHidden: !visible('less-space-bangumi'),
      gameHidden: !visible('less-space-game'),
      liveHidden: !visible('less-space-live')
    };
  })()`);

  assert(spaceCleanupResult.profileVisible, '个人空间保留 UP 信息和视频入口');
  assert(spaceCleanupResult.followHidden, '个人空间隐藏关注关系入口');
  assert(spaceCleanupResult.fansHidden, '个人空间隐藏粉丝关系入口');
  assert(spaceCleanupResult.bangumiHidden, '个人空间隐藏追番追剧区块');
  assert(spaceCleanupResult.gameHidden, '个人空间隐藏游戏推广区块');
  assert(spaceCleanupResult.liveHidden, '个人空间隐藏直播推广区块');
  page.close();
}

async function testRedirect(extensionId) {
  const page = await newPage('about:blank');
  await page.enablePage();
  await page.navigate('https://www.bilibili.com/', 7000);
  const redirectedUrl = await page.eval('location.href');
  assert(redirectedUrl.startsWith('https://t.bilibili.com'), '首页默认跳转到关注动态');

  const popup = await newPage(`chrome-extension://${extensionId}/popup/popup.html`);
  await popup.enablePage();
  await sleep(1000);
  await popup.eval(`(async () => {
    const input = document.getElementById('module-redirect');
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);
  popup.close();

  await page.navigate('https://www.bilibili.com/', 7000);
  const nonRedirectedUrl = await page.eval('location.href');
  assert(nonRedirectedUrl.startsWith('https://www.bilibili.com'), '关闭首页重定向后不再跳转');

  const restorePopup = await newPage(`chrome-extension://${extensionId}/popup/popup.html`);
  await restorePopup.enablePage();
  await sleep(1000);
  await restorePopup.eval(`(async () => {
    const input = document.getElementById('module-redirect');
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);
  restorePopup.close();
  page.close();
}

async function saveWhitelist(extensionId, urls) {
  const options = await newPage(`chrome-extension://${extensionId}/options/options.html`);
  await options.enablePage();
  await sleep(1000);
  await options.eval(`(async () => {
    const textarea = document.getElementById('whitelist-allowed-urls');
    textarea.value = ${JSON.stringify(urls.join('\n'))};
    document.getElementById('save-whitelist').click();
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  })()`);
  options.close();
}

async function testWhitelist(extensionId) {
  await saveWhitelist(extensionId, ['https://www.bilibili.com/']);

  const page = await newPage('about:blank');
  await page.enablePage();
  await page.navigate('https://www.bilibili.com/', 7000);
  const whitelistedUrl = await page.eval('location.href');
  assert(whitelistedUrl.startsWith('https://www.bilibili.com'), '白名单中的首页不会被重定向');
  page.close();

  await saveWhitelist(extensionId, []);

  const restoredPage = await newPage('about:blank');
  await restoredPage.enablePage();
  await restoredPage.navigate('https://www.bilibili.com/', 7000);
  const redirectedUrl = await restoredPage.eval('location.href');
  assert(redirectedUrl.startsWith('https://t.bilibili.com'), '清空白名单后首页重定向恢复');
  restoredPage.close();
}

async function main() {
  let browserProcess;
  try {
    prepareExtension();
    const browser = findBrowser();
    log(`INFO 使用浏览器: ${browser}`);
    browserProcess = launchBrowser(browser);
    await waitForDebugEndpoint();
    const extensionId = await waitForExtensionId();
    log(`INFO 扩展 ID: ${extensionId}`);

    await testPopup(extensionId);
    await testOptionsPage(extensionId);
    await testPresetSwitching(extensionId);
    await testRulesetSwitching(extensionId);
    await testVideoPage();
    await testSpacePage();
    await testRedirect(extensionId);
    await testWhitelist(extensionId);

    log('PASS 自动回归测试完成');
  } finally {
    if (browserProcess && !browserProcess.killed) {
      browserProcess.kill();
    }
    await sleep(1000);
    cleanupDir(EXT_DIR);
    cleanupDir(PROFILE_DIR);
  }
}

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
