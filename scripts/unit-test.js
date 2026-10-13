const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
require('../settings.js');
const policy = globalThis.BilibiliLessSettings;
const defaults = policy.mergeSettings();

for (const url of [
  'https://t.bilibili.com/', 'https://space.bilibili.com/2/relation/follow',
  'https://www.bilibili.com/video/BV123/', 'https://www.bilibili.com/space/2',
  'https://www.bilibili.com/bangumi/play/ep123',
  'https://www.bilibili.com/account/history', 'https://www.bilibili.com/account/fav',
  'https://www.bilibili.com/list/watchlater', 'https://passport.bilibili.com/login',
  'https://search.bilibili.com/all?keyword=%E6%B5%8B%E8%AF%95',
  'https://evilbilibili.com/', 'https://bilibili.com.evil.example/'
]) assert.equal(policy.shouldRedirectUrl(url, defaults), false, url);
for (const url of [
  'https://www.bilibili.com/', 'https://www.bilibili.com/v/popular',
  'https://live.bilibili.com/1', 'https://search.bilibili.com/',
  'https://search.bilibili.com/all?keyword=%20%20',
  'https://www.bilibili.com/history-trap', 'https://www.bilibili.com/account/history-trap'
]) assert.equal(policy.shouldRedirectUrl(url, defaults), true, url);
assert.equal(policy.shouldRedirectUrl('https://search.bilibili.com/all?keyword=test',
  policy.mergeSettings({ modules: { search: false } })), true);
assert.equal(policy.shouldRedirectUrl('https://www.bilibili.com/', policy.mergeSettings({ enabled: false })), false);
assert.equal(policy.mergeSettings({ preset: 'old', modules: { comments: false } }).modules.comments, false);
assert.equal(policy.mergeSettings(null).modules.search, true);
assert.throws(() => policy.parseWhitelist('https://example.com/'));
assert.throws(() => policy.parseWhitelist('https://bilibili.com.evil.example/'));
assert.throws(() => policy.parseWhitelist('https://*.bilibili.com/'));
assert.throws(() => policy.parseWhitelist('javascript:alert(1)'));
assert.deepEqual(policy.parseWhitelist('https://WWW.bilibili.com\nhttps://www.bilibili.com/#anchor'), ['https://www.bilibili.com/']);
const exceptions = policy.mergeSettings({ whitelist: { allowedUrls: ['https://www.bilibili.com/video/BV*/'] } });
assert.equal(policy.isUrlWhitelisted('https://www.bilibili.com/video/BV123/?p=2', exceptions), true);
assert.equal(policy.isUrlWhitelisted('https://www.bilibili.com.evil.example/video/BV123/', exceptions), false);
assert.equal(policy.isUrlWhitelisted('https://www.bilibili.com/video/av123/', exceptions), false);
const css = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8').match(/const EXTENSION_CSS = `([\s\S]*?)`;/)[1];
assert.equal(css.trim(), fs.readFileSync(path.join(ROOT, 'content.css'), 'utf8').trim(), 'CSS copies must stay in sync');
console.log('PASS 主动访问路径、空搜索、域名边界、旧设置兼容、例外校验和 CSS 同步');

async function testWorker() {
  let stored = defaults;
  let rules = [];
  let enabledRulesets = [];
  let reloads = 0;
  const messages = [];
  const storageListeners = [];
  const event = () => ({ addListener() {} });
  const chrome = {
    storage: {
      local: {
        get: async () => ({ settings: structuredClone(stored) }),
        set: async ({ settings }) => {
          const oldValue = stored;
          stored = structuredClone(settings);
          storageListeners.forEach(listener => listener({ settings: { oldValue, newValue: stored } }, 'local'));
        }
      }, onChanged: { addListener: listener => storageListeners.push(listener) }
    },
    runtime: { id: 'test-extension', onMessage: { addListener: listener => messages.push(listener) }, onStartup: event(), onInstalled: event() },
    declarativeNetRequest: {
      updateEnabledRulesets: async options => { enabledRulesets = options.enableRulesetIds; },
      getDynamicRules: async () => rules,
      updateDynamicRules: async options => { rules = options.addRules; }
    },
    tabs: { query: async () => [{ id: 1, url: 'https://www.bilibili.com/video/BV123/' }], sendMessage: async () => {}, reload: async () => reloads++ },
    webNavigation: { onBeforeNavigate: event(), onHistoryStateUpdated: event() }
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8').replace("import './settings.js';", ''),
    { BilibiliLessSettings: policy, chrome, URL, console });
  const patch = value => new Promise(resolve => messages[0]({ type: 'BILIBILI_LESS_PATCH_SETTINGS', patch: value }, { id: 'test-extension' }, resolve));
  const responses = await Promise.all([
    patch({ modules: { comments: false } }),
    patch({ modules: { danmaku: false } }),
    patch({ whitelist: { allowedUrls: ['https://www.bilibili.com/video/BV*/'] } })
  ]);
  assert(responses.every(response => response.ok));
  assert.equal(stored.modules.comments, false);
  assert.equal(stored.modules.danmaku, false);
  assert.equal(stored.whitelist.allowedUrls.length, 1);
  assert.equal(rules[0].action.type, 'allowAllRequests');
  assert.equal(new RegExp(rules[0].condition.regexFilter).test('https://www.bilibili.com.evil.example/video/BV1/'), false);
  await patch({ modules: { recommendations: false } });
  assert.equal(enabledRulesets.includes('ruleset_recommendations'), false);
  assert.equal(enabledRulesets.includes('ruleset_ads'), true);
  assert.equal(reloads, 0);
  const invalid = await patch({ whitelist: { allowedUrls: ['https://evil.example/'] } });
  assert.equal(invalid.ok, false);
  assert.equal(stored.whitelist.allowedUrls.length, 1);
  await patch({ enabled: false });
  assert.equal(enabledRulesets.length, 0);
  assert.equal(rules.length, 0);
  console.log('PASS 并发设置不会相互覆盖、网络例外与独立规则切换、暂停恢复、观看不被刷新');
}
testWorker().catch(error => { console.error(error); process.exitCode = 1; });
