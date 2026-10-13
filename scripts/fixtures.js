// Small representative Bilibili documents for repeatable extension integration tests.
module.exports = function fixtureFor(rawUrl) {
  const url = new URL(rawUrl);
  const header = `<header class="bili-header__bar"><a href="https://www.bilibili.com/">首页</a>
    <a class="nav-item" id="following-entry" href="https://t.bilibili.com/">动态</a>
    <a id="history-entry" href="/account/history">历史</a><a href="/anime">番剧</a>
    <div class="nav-search-box"><input class="nav-search-input" placeholder="推荐热搜词">
    <div class="search-panel">搜索热榜</div></div></header>`;
  let body;
  if (url.hostname === 'search.bilibili.com') {
    body = `<main><div class="trending" id="search-trending">热搜榜</div>
      <div class="search-header"><div class="search-panel search-panel-popover" id="search-suggest"><div class="suggestions">热门搜索建议</div></div></div>
      <div id="search-results"><h1>搜索结果</h1><a href="https://www.bilibili.com/video/BV1Q5411w7z5/">主动搜索的视频</a></div>
      <div id="search-filters">排序、时长与分区</div></main>`;
  } else if (url.hostname === 'space.bilibili.com' || url.pathname.startsWith('/space/')) {
    body = '<main><h1>UP 空间</h1><a href="https://www.bilibili.com/video/BV1Q5411w7z5/">投稿</a></main>';
  } else if (url.hostname === 't.bilibili.com') {
    body = `<main><div class="bili-dyn-up-list"><a class="nav-item" id="followed-avatar" href="https://space.bilibili.com/2">关注的 UP</a></div>
      <div class="bili-dyn-list__item" id="followed-post">关注动态<div class="bili-dyn-content__orig__topic">UP 发表的主题</div><div class="bili-dyn-topic" id="followed-topic">投稿中的主题内容</div><div class="bili-dyn-actions">评论</div></div>
      <aside class="bili-dyn-sidebar"><div class="bili-dyn-topic" id="feed-topics">热门话题</div></aside>
      <div class="bili-dyn-live-users">直播推荐</div><div class="bili-dyn-up-recommend">推荐 UP</div></main>`;
  } else {
    body = `<main><section class="video-info-container"><h1 class="video-title">测试视频</h1><p>UP 信息与简介</p></section>
      <div class="bpx-player-container"><video autoplay style="width:760px;height:340px;background:#111"></video>
      <label class="bpx-player-autoplay"><input type="checkbox" id="player-autoplay" checked>自动连播</label><button class="bpx-player-next-button">下一个</button></div>
      <div class="video-toolbar">收藏 · 投币</div><div class="video-pod__list">手动选集</div>
      <div class="recommend-list">相关视频</div><section class="reply-wrap">评论</section>
      <div class="bpx-player-danmaku">弹幕</div>
      <div class="login-popup" id="login-dialog" style="position:fixed;right:10px;top:10px">登录</div></main>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>Bilibili fixture</title>
    <style>body{margin:0;background:#fff;font:16px sans-serif}header{display:flex;gap:16px;padding:16px}main{padding:20px}section{min-height:100px}.video-toolbar,.video-pod__list{height:40px}.bpx-player-container{width:760px}</style></head><body>${header}${body}
    <script>sessionStorage.fixtureVisits = String(Number(sessionStorage.fixtureVisits || 0) + 1);
      window.autoplayEnabled = true;
      document.getElementById('player-autoplay')?.addEventListener('click', event => {
        window.autoplayEnabled = !window.autoplayEnabled;
        event.currentTarget.setAttribute('aria-checked', String(window.autoplayEnabled));
      });
      document.querySelector('video')?.addEventListener('ended', () => { window.nextVideoTriggered = true; });
    </script></body></html>`;
};
