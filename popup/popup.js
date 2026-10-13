document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('search-keyword');
  await createSettingsUI({
    render(settings) {
      const enabled = settings.enabled;
      document.getElementById('statusText').textContent = !enabled ? '已暂停，页面恢复原样'
        : Object.values(settings.modules).every(Boolean) ? '已开启 · 默认设置' : '已开启 · 自定义设置';
      const canSearch = !enabled || settings.modules.search;
      searchInput.disabled = !canSearch;
      document.getElementById('search-submit').disabled = !canSearch;
      document.getElementById('search-note').textContent = canSearch
        ? '输入关键词，直接进入搜索结果。' : '搜索已关闭，可在更多设置中开启。';
      const protections = [
        ['recommendations', '推荐'], ['exploration', '热搜'], ['autoplay', '自动连播']
      ].filter(([module]) => settings.modules[module]).map(([, label]) => label);
      document.getElementById('protection-summary').textContent = !enabled ? '开启后，继续按你的设置减少干扰。'
        : protections.length ? `已收起${protections.join('、')}。` : '推荐、热搜和自动连播均已放开。';
    },
    status(text, error = false) {
      const el = document.getElementById('save-status');
      el.textContent = text;
      el.classList.toggle('error', error);
    }
  });
  document.getElementById('search-form').addEventListener('submit', async event => {
    event.preventDefault();
    const keyword = searchInput.value.trim();
    if (!keyword) { searchInput.setCustomValidity('请先输入你想看的内容。'); searchInput.reportValidity(); return; }
    try {
      await chrome.tabs.create({ url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}` });
      window.close();
    } catch { document.getElementById('search-note').textContent = '未能打开搜索，请重试。'; }
  });
  searchInput.addEventListener('input', () => searchInput.setCustomValidity(''));
  document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
});
