# 故障排查

这里记录常见问题和排查方式。

## 修改开关后没有立即生效

可以按顺序尝试：

1. 刷新当前 B 站页面。
2. 关闭并重新打开扩展 popup，确认开关状态已经保存。
3. 打开完整设置页，确认模块状态是否正确。
4. 在浏览器扩展管理页点击“重新加载”。

## 视频页某个正常功能被隐藏

先切到“温和”模式。

如果功能恢复，说明它被某个模块覆盖到了。可以逐个关闭以下模块定位：

- 导航入口
- 推荐内容
- 评论区
- 弹幕功能
- 广告推广
- 结束推荐
- 禁用自动连播

定位到具体模块后，再调整选择器或隐藏策略。

## 首页没有跳转到关注动态

确认：

- 扩展总开关已开启。
- “首页重定向”模块已开启。
- 当前页面没有命中白名单。
- 当前页面确实是 `www.bilibili.com` 首页或分区页。

如果刚改过开关或白名单，刷新页面后再试。

## 不想让某个页面被处理

把页面加入白名单。

打开完整设置页，在“页面白名单”中每行填写一个 URL 或通配符，例如：

```text
https://www.bilibili.com/
https://www.bilibili.com/v/popular
https://www.bilibili.com/video/BV*/
```

保存后刷新目标页面。

## 白名单没有生效

确认：

- 每行只写一个 URL 或通配符。
- URL 包含协议，例如 `https://`。
- 保存白名单后刷新目标页面。
- 没有多余空格。

匹配规则：

- 没有 `*` 的条目按 URL 前缀匹配。
- 包含 `*` 的条目按通配符匹配。

## popup 或设置页显示异常

可以尝试：

1. 在扩展管理页重新加载扩展。
2. 关闭并重新打开 popup。
3. 打开完整设置页检查配置是否正常。
4. 运行自动回归测试确认扩展是否仍能正常加载。

## 自动回归测试失败

运行：

```bash
node scripts/regression-test.js
```

如果提示找不到浏览器，可以指定浏览器路径：

```bash
set BILIBILI_LESS_BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
node scripts\regression-test.js
```

如果失败发生在视频页加载阶段，可能是默认测试视频临时不可访问。可以换一个视频：

```bash
set BILIBILI_LESS_TEST_VIDEO=https://www.bilibili.com/video/你的BV号/
node scripts\regression-test.js
```

## 自动测试会影响日常浏览器吗

不会。

测试脚本会复制一份临时扩展目录，并启动独立的 Edge/Chromium 测试配置。测试结束后会关闭测试浏览器并清理临时目录。
