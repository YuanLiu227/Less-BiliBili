# 修改总结

本文档记录当前版本已经完成的主要改动，方便快速了解项目状态。

## 当前目标

Less BiliBili 的目标已经从早期的“纯播放器模式”调整为“保留正常观看体验的注意力管理工具”。

当前目标：

- 保留关注动态到视频详情页的主动观看路径。
- 保留视频详情页正常功能。
- 隐藏推荐、评论、弹幕、广告等注意力干扰。
- 提供可配置的模块开关、模式预设和白名单。

## 已完成能力

### 视频页正常功能保留

当前保留：

- 播放器
- 视频标题
- UP 信息
- 视频数据
- 简介和标签
- 点赞、投币、收藏、分享等操作栏
- 选集/合集
- 宽屏、小窗等播放器按钮

当前默认隐藏：

- 右侧推荐
- 评论区
- 弹幕层、弹幕开关、弹幕输入框、弹幕列表
- 广告推广
- 播放结束推荐

### 模块化开关

popup 和完整设置页都可以控制：

- 动态页整理
- 导航入口
- 推荐内容
- 评论区
- 弹幕功能
- 广告推广
- 结束推荐
- 禁用自动连播
- 首页重定向

这些开关统一保存到 `settings.modules`。

### 模式预设

当前有三个预设：

- 温和：主要隐藏推荐和广告，保留评论、弹幕、导航和自动连播。
- 专注：默认方案，隐藏主要注意力干扰，并禁用自动连播。
- 严格：预留给更强限制项，目前与专注模式一致。

手动调整任意模块后，配置会进入自定义状态。

### 分模块网络拦截

原来的单个 `rules.json` 已拆分为：

- `rules_recommendations.json`
- `rules_dynamic.json`
- `rules_ads.json`

推荐内容、动态页整理、广告推广分别对应独立 DNR 规则集。关闭某个模块时，只会停用对应网络规则。

### 禁用自动连播

新增“禁用自动连播”模块。

开启后：

- 内容脚本会关闭视频元素上的 `autoplay`。
- 视频自然结束时会阻止自动下一集逻辑。
- 用户手动点击选集、合集、下一集不受影响。

### 完整设置页

新增 `options/` 目录：

- `options/options.html`
- `options/options.css`
- `options/options.js`

完整设置页支持：

- 总开关
- 模式预设
- 全部模块开关
- 页面白名单

popup 中新增“打开完整设置”入口。

### 页面白名单

白名单保存在 `settings.whitelist.allowedUrls`。

匹配白名单后：

- 后台重定向会放行该页面。
- 内容脚本会暂停页面清理。
- 清空白名单后恢复默认保护逻辑。

白名单支持 URL 前缀和 `*` 通配符。

## 文档更新

当前项目文档包括：

- `README.md`：项目介绍、安装、功能和验证方式。
- `CHANGE_SUMMARY.md`：修改总结。
- `PRIVACY.md`：隐私说明。
- `TROUBLESHOOTING.md`：故障排查。

## 自动回归测试

新增并持续维护：

- `scripts/regression-test.js`

测试内容包括：

- 扩展可加载。
- popup 总开关、模块开关、模式预设存在。
- 设置页可打开并保存白名单。
- 模式预设可切换。
- 分模块 DNR 规则可独立启停。
- 视频页内容脚本正常注入。
- 播放器、标题、操作栏、选集/合集可见。
- 视频元素 `autoplay` 已关闭。
- 默认隐藏模块生效。
- 首页默认跳转到动态页。
- 关闭首页重定向后不再跳转。
- 白名单中的页面不会被重定向。
- 清空白名单后首页重定向恢复。

## 验证命令

```bash
node --check content.js
node --check background.js
node --check popup/popup.js
node --check options/options.js
node --check scripts/regression-test.js
node -e "const fs=require('fs'); for (const f of ['manifest.json','rules_recommendations.json','rules_dynamic.json','rules_ads.json']) JSON.parse(fs.readFileSync(f,'utf8'))"
node scripts/regression-test.js
```

## 当前评价

当前实现比旧的纯播放器方案更合理。

它不再粗暴隐藏整个视频详情页，而是通过模块化策略精确隐藏注意力入口，因此能同时满足两个目标：

- B 站视频页仍然正常可用。
- 推荐、评论、弹幕、广告等干扰项默认收起。
