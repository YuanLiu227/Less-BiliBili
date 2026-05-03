# Less BiliBili · 少上B站

> 屏蔽 B 站推荐系统，只保留动态页 → 看视频这一条路径，抵制注意力工程。
>
> Block Bilibili's recommendation system — keep only the essentials. Resist attention engineering.

---

## Overview | 概述

**Less BiliBili** 是一个 Manifest V3 浏览器扩展，理念是**不控制你、不推荐你、不让你上瘾**。

B站首页有大量推荐内容、热搜榜、直播推荐、信息流等——这些都是注意力工程的一部分。这个扩展的作用很简单：只保留"关注动态 → 看视频"这条核心路径，其余全部屏蔽。

### 保留了什么

| 功能 | 说明 |
|------|------|
| ✅ 动态页 (t.bilibili.com) | 查看关注 UP 主的动态更新 |
| ✅ 视频播放页 | 观看视频（纯播放器模式） |
| ✅ 历史记录 | 浏览观看历史 |
| ✅ 个人空间 (space.bilibili.com) | 访问他人主页 |
| ✅ 登录相关 (passport.bilibili.com) | 登录/认证不受影响 |

### 屏蔽了什么

**页面元素**
- 搜索栏、热搜榜、推荐列表
- 顶部导航栏（首页、番剧、直播等）
- 点赞/投币/收藏/分享按钮栏
- 评论区、弹幕、弹幕输入框
- 视频推荐列表、相关视频
- 视频结束覆盖层（推荐 next up）
- UP 主信息、视频描述、标签
- 横幅广告、推广内容、直播推荐
- 各类悬停弹出框、提示框

**API 请求**
- 热门推荐 (`popular`)
- 首页推荐 feed (`top/feed/rcmd`)
- 相关视频 (`archive/related`)
- 分区动态 (`dynamic/region`)
- 热搜词 (`hotword`)
- 在线列表 (`online/list`)
- 广告系统 (`cm.bilibili.com`)

---

## Installation | 安装

### Chrome / Edge

1. 从 Releases 下载或克隆本仓库
2. 打开浏览器扩展管理页面：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目文件夹
5. 完成

### 手动构建（可选）

```bash
git clone https://github.com/YuanLiu227/Less-BiliBili.git
```

然后按上述步骤加载 `Less-BiliBili/` 目录。

---

## Usage | 使用说明

安装后扩展默认**启用**。

- **启用状态**：打开 B 站时自动拦截推荐 API、隐藏干扰元素。
- **暂停**：点击扩展图标 → 关闭"启用扩展"开关 → 页面自动刷新恢复原始 B 站。
- **恢复**：重新打开开关即可。
- **重定向保护**：尝试访问首页、分区页等非允许页面时，自动跳转到动态页。

---

## Permissions | 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存扩展开关状态、跨上下文同步设置 |
| `declarativeNetRequest` | 拦截推荐/广告 API 请求（规则内置，不上传任何数据） |
| `webNavigation` | 监听页面导航，拦截非允许页面的访问 |
| `*://*.bilibili.com/*` | 在 B 站域名下执行清理操作 |

扩展**不收集任何数据**，**不发送任何网络请求**（除了浏览器内核执行的 DNR 规则），**不需要任何账号权限**。

---

## Technical Details | 技术说明

### 架构

```
popup/          ← 弹出控制面板（开关）
  popup.html
  popup.css
  popup.js

content.js      ← 注入到页面的脚本（document_start）
                  - CSS 动态注入/移除（用于隐藏元素）
                  - MutationObserver 监听 DOM 变化
                  - SPA 导航拦截
                  - 文本匹配兜底（B站 CSS Modules 类名变化）

background.js   ← Service Worker
                  - webNavigation 页面重定向
                  - DNR 规则集同步

rules.json      ← declarativeNetRequest 规则
                  - 拦截 7 个推荐/广告 API
```

### 关键设计决策

1. **CSS 嵌入 JS 而非声明在 manifest.json 中**
   - 原因：manifest.json 注入的 CSS 无法在运行时移除
   - 方案：CSS 作为 JS 模板字符串，通过 `<style>` 标签动态注入/移除
   - 效果：暂停扩展时可彻底恢复 B 站原始样式

2. **两层隐藏机制**
   - 第一层：`display: none !important` — 精确选择器匹配已知类名
   - 第二层：`visibility: hidden` + 播放器 `visibility: visible` — 兜底覆盖所有未知元素
   - 这样即使 B 站更新了类名，视频页依然只显示播放器

3. **文本匹配兜底**
   - B 站使用 CSS Modules，类名随构建变化
   - 通过 `TreeWalker` 按文本内容（"首页"、"番剧"等）查找导航项进行隐藏

4. **背景色同步**
   - 动态页背景色通过 `getComputedStyle` 提取
   - 存储后应用到视频页，避免全黑背景的不自然感

### 浏览器支持

- Chrome 88+
- Edge 88+
- 任何基于 Chromium 的浏览器（Manifest V3）

---

## Development | 开发

```bash
git clone https://github.com/YuanLiu227/Less-BiliBili.git
```

修改后：
1. 在 `chrome://extensions` 点击"重新加载"
2. 或右键扩展图标 → 管理扩展程序 → 重新加载

### 项目结构

```
Less-BiliBili/
├── manifest.json          # 扩展配置文件
├── content.js             # 内容脚本（CSS注入 + DOM清理）
├── content.css            # CSS 源文件（编辑用，嵌入在 content.js 中）
├── background.js          # Service Worker
├── rules.json             # DNR 规则（API 拦截）
├── popup/
│   ├── popup.html         # 弹出面板
│   ├── popup.css          # 弹出面板样式
│   └── popup.js           # 弹出面板逻辑
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Philosophy | 理念

B站是一个很好的视频平台，但它的推荐系统被设计来最大化你的停留时间，而不是最大化你的收获。

> "注意力经济"的商业模式是：产品越吸引用户注意力，越能让用户上瘾，就能从中获利。

这个扩展不评价用户的选择，而是提供一个工具——让想摆脱推荐系统的人有一个简单的选择。

你只应该看你想看的内容。

---

## License | 许可证

MIT
