# 修改总结

本文档记录当前版本已经完成的主要能力，方便快速理解项目状态。

## 当前目标

Less BiliBili 的目标不是把 B 站变成一个极简播放器，而是保留主动观看路径，减少推荐流、社交反馈和商业推广对注意力的拉扯。

核心目标：

- 保留关注动态、个人空间、历史记录和视频详情页。
- 保留视频播放、标题、UP 信息、简介、操作栏、选集/合集等正常观看能力。
- 默认隐藏推荐、评论、弹幕、广告、热搜、分享扩散、关系跳转和自动连播入口。
- 通过模块开关、模式预设和白名单保持可控。

## 已完成能力

### 视频页清理

默认保留：

- 播放器
- 视频标题
- UP 信息
- 视频数据
- 简介
- 操作栏
- 选集/合集
- 宽屏、小窗等播放器按钮

默认隐藏：

- 右侧推荐和相关视频
- 评论区
- 弹幕层、弹幕开关、弹幕输入框、弹幕列表
- 搜索标签和分享扩散入口
- 广告和活动推广
- 自动连播、自动开播和“下一个”入口
- 播放结束后的推荐覆盖层

### 个人空间清理

当前内容脚本会注入 `space.bilibili.com`。

默认保留：

- UP 主基础信息
- 主页、投稿、合集等主动浏览入口
- 视频列表

默认隐藏：

- 顶部泛导航
- 关注/粉丝关系入口
- 追番追剧区块
- 直播间推广
- 最近玩过的游戏和游戏下载推广
- 稍后再看等容易继续扩散的入口

### 动态页整理

默认隐藏：

- 非视频动态
- 动态卡片评论区
- 点赞、评论等社交动作入口
- 搜索热词和热榜入口
- 浮层提示和悬浮干扰

### 模块化开关

popup 和完整设置页都可以控制：

- 动态页整理
- 探索入口
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

当前有三种预设：

- 温和：主要隐藏推荐和广告，保留评论、弹幕、导航、探索入口和自动连播。
- 专注：默认方案，隐藏主要注意力干扰，并禁用自动连播。
- 严格：当前与专注一致，预留给后续更强限制项。

手动调整任意模块后，配置会进入自定义状态。

### 分模块网络拦截

当前 DNR 规则集：

- `rules_recommendations.json`
- `rules_exploration.json`
- `rules_dynamic.json`
- `rules_ads.json`

推荐内容、探索入口、动态页整理、广告推广分别对应独立规则集。关闭某个模块时，只停用对应网络规则。

### 首页重定向

首页和分区页默认会跳转到关注动态页，避免进入推荐流。

默认允许：

- `t.bilibili.com`
- `space.bilibili.com`
- `passport.bilibili.com`
- `www.bilibili.com/video/`
- `www.bilibili.com/history`
- `www.bilibili.com/account/history`

### 白名单

白名单保存到 `settings.whitelist.allowedUrls`。

匹配白名单后：

- 后台重定向放行该页面。
- 内容脚本暂停 DOM 清理。
- 清空白名单后恢复默认保护逻辑。

白名单支持 URL 前缀和 `*` 通配符。

## 文档

当前项目文档：

- `README.md`：项目介绍、功能、安装和验证方式。
- `CHANGE_SUMMARY.md`：当前能力和主要变更。
- `PRIVACY.md`：隐私和权限说明。
- `TROUBLESHOOTING.md`：常见问题排查。

## 自动回归测试

脚本：`scripts/regression-test.js`

覆盖内容：

- 扩展可加载。
- popup 和设置页结构完整。
- 模式预设可切换。
- 白名单可保存。
- DNR 规则集可独立启停。
- 视频页播放器、标题、操作栏、选集/合集保留。
- 推荐、评论、弹幕、探索入口、自动连播入口默认隐藏。
- 个人空间注入正常，并隐藏关系、追番、直播和游戏推广入口。
- 首页重定向和白名单逻辑正常。

验证命令：

```bash
node --check content.js
node --check background.js
node --check popup/popup.js
node --check options/options.js
node --check scripts/regression-test.js
node -e "const fs=require('fs'); for (const f of ['manifest.json','rules_recommendations.json','rules_exploration.json','rules_dynamic.json','rules_ads.json']) JSON.parse(fs.readFileSync(f,'utf8'))"
node scripts/regression-test.js
```

## 当前评价

当前实现已经从早期的粗暴隐藏，调整为按页面和模块精确清理。它保留观看主线，同时把推荐流、社交反馈、商业推广和自动续播这些高牵引入口默认收起。
