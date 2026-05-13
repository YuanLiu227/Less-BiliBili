# Less BiliBili

Less BiliBili 是一个 Manifest V3 浏览器扩展，用来把 B 站从“推荐流平台”尽量拉回“主动观看工具”。

它保留从关注动态进入视频、正常观看视频的路径，同时隐藏推荐、评论、弹幕、广告、热搜、推广等容易分散注意力的内容。它不是纯播放器模式：视频详情页中的标题、UP 信息、简介、操作栏、选集/合集、宽屏、小窗等正常功能会尽量保留。

## 功能概览

默认保留：

| 场景 | 保留内容 |
| --- | --- |
| 关注动态 | 查看已关注 UP 的动态更新 |
| 视频详情页 | 播放器、标题、UP 信息、视频数据、简介、标签、操作栏、选集/合集、宽屏、小窗 |
| 历史记录 | `www.bilibili.com/history`、`www.bilibili.com/account/history` |
| 个人空间 | `space.bilibili.com` |
| 登录相关 | `passport.bilibili.com` |

默认隐藏：

- 动态页搜索、热搜、非视频动态和社交提示
- 容易偏离目标的顶部导航入口
- 视频页右侧推荐、相关视频和推荐接口
- 视频页评论区
- 弹幕层、弹幕开关、弹幕输入框、弹幕列表
- 广告、活动、下载提示、直播推广和商品推广
- 播放结束后的推荐覆盖层
- B 站首页和分区页默认跳转到关注动态页

## 模式预设

popup 和完整设置页都支持三种预设：

| 预设 | 说明 |
| --- | --- |
| 温和 | 主要隐藏推荐和广告，保留评论、弹幕、导航和自动连播 |
| 专注 | 默认方案，隐藏主要注意力干扰，并禁用自动连播 |
| 严格 | 预留给后续更强限制项，目前与专注模式一致 |

手动调整任意模块后，当前配置会变为自定义状态。

## 模块开关

| 模块 | 作用 |
| --- | --- |
| 启用扩展 | 一键暂停或恢复全部清理逻辑 |
| 动态页整理 | 收起动态页搜索、热搜、非视频动态和社交提示 |
| 导航入口 | 隐藏首页、直播、番剧等容易偏航的入口 |
| 推荐内容 | 隐藏右侧推荐、相关视频和推荐接口 |
| 评论区 | 隐藏视频页评论区域 |
| 弹幕功能 | 隐藏弹幕层、开关、输入框和弹幕列表 |
| 广告推广 | 隐藏广告、活动、下载提示和推广组件 |
| 结束推荐 | 隐藏播放结束后的推荐覆盖层 |
| 禁用自动连播 | 视频自然结束后不自动播放下一个内容 |
| 首页重定向 | 访问首页或分区页时跳回关注动态 |

推荐内容、动态页整理、广告推广分别对应独立的 DNR 网络规则集。关闭其中某个模块时，不会连带关闭其他网络拦截模块。

## 完整设置页

点击 popup 里的“打开完整设置”，或从浏览器扩展管理页进入选项页，可以打开完整设置页。

完整设置页支持：

- 总开关
- 模式预设
- 全部模块开关
- 页面白名单

## 页面白名单

白名单用于放行某些 B 站页面。匹配白名单后，该页面不会被首页重定向，也不会执行内容清理。

每行一个 URL 或通配符，例如：

```text
https://www.bilibili.com/
https://www.bilibili.com/v/popular
https://www.bilibili.com/video/BV*/
```

没有 `*` 的条目按 URL 前缀匹配；包含 `*` 的条目按通配符匹配。

## 安装

1. 克隆或下载本仓库。
2. 打开浏览器扩展管理页：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. 开启开发者模式。
4. 选择“加载已解压的扩展程序”，加载本项目目录。

## 开发与验证

静态检查：

```bash
node --check content.js
node --check background.js
node --check popup/popup.js
node --check options/options.js
node --check scripts/regression-test.js
node -e "const fs=require('fs'); for (const f of ['manifest.json','rules_recommendations.json','rules_dynamic.json','rules_ads.json']) JSON.parse(fs.readFileSync(f,'utf8'))"
```

自动回归测试：

```bash
node scripts/regression-test.js
```

回归脚本会复制一份临时扩展目录，启动独立的 Edge/Chromium 测试配置，不使用你的日常浏览器配置。

当前覆盖：

- 扩展能够加载
- popup 总开关、模块开关、模式预设存在
- 设置页能够打开并保存白名单
- 模式预设能够切换，并能恢复默认专注模式
- 推荐、动态、广告三组网络规则能独立启停
- 视频页注入正常，播放器和基础视频信息可见
- 操作栏和选集/合集可见
- 视频元素的 `autoplay` 被关闭
- 推荐、评论、弹幕等默认模块生效
- 首页默认跳转到关注动态
- 关闭首页重定向后首页不再跳转
- 白名单中的页面不会被重定向，清空白名单后重定向恢复

## 项目结构

```text
manifest.json                 扩展配置
background.js                 后台服务，负责重定向和 DNR 规则同步
content.js                    页面脚本，负责注入样式、DOM 清理、SPA 路由处理
content.css                   与 content.js 内置样式保持同步的 CSS 源文件
rules_recommendations.json    推荐内容网络拦截规则
rules_dynamic.json            动态页和热搜网络拦截规则
rules_ads.json                广告推广网络拦截规则
popup/                        扩展弹窗控制面板
options/                      完整设置页
scripts/                      自动化验证脚本
icons/                        扩展图标
```

## 文档

- [修改总结](./CHANGE_SUMMARY.md)
- [隐私说明](./PRIVACY.md)
- [故障排查](./TROUBLESHOOTING.md)

## 设计原则

这个项目不替用户决定要看什么，而是把“主动选择观看”和“被推荐系统推着走”分开。

播放器本身应该尽量正常；注意力干扰应该明确、可控、可关闭。

## License

MIT
