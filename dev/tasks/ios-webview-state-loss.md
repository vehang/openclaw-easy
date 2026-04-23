# iOS WebView 设置页面状态丢失问题

> 记录时间：2026-04-23
> 状态：待修复
> 项目：openclaw-easy
> 文件：`public/index.html`

## 问题描述

在 iOS App 内嵌 WebView 打开 openclaw-easy 的 Web 设置页面时：

1. **表单数据丢失**：步骤2 中已填写的 API 地址、API Key 等信息，点击"配置教程"跳转到第三方页面后再返回，数据全部失效
2. **弹窗按钮失效**：如果在 Web 窗口中打开了弹窗，跳转后再返回，弹窗按钮无法点击
3. **仅 iOS 复现**，Android 正常

## 根本原因

### iOS WKWebView 内存回收机制

iOS Safari/WKWebView 在用户离开页面（`<a target="_blank">` 跳转）后，对原页面进行**内存压缩或冻结**：

- **重新加载**：iOS 丢弃页面，返回时重新走 `DOMContentLoaded` → `loadConfig()` 从服务端拉配置。但步骤2 的 IM 配置**还没提交到服务端**，所以表单为空
- **bfcache 半死状态**：DOM 保留但 JS 上下文被清空，按钮事件监听丢失、定时器被清除

### Android 没问题的原因

Android WebView 对 bfcache 处理更激进地保留完整页面状态，`target="_blank"` 跳转时原页面保持内存中完整存活。

## 代码层面缺失

当前 `index.html`（3013行）中：

- ❌ 没有 `pageshow` 事件监听（bfcache 恢复检测）
- ❌ 没有 `visibilitychange` 事件监听
- ❌ 表单中间状态不持久化（无 localStorage/sessionStorage 草稿）
- ❌ 没有冻结/恢复检测机制
- ✅ `fetchWithAuth` 已有超时保护（10s），但无法覆盖页面冻结场景

## 修复方案

### 方案 A（最简单）：跳转前自动保存草稿
- 点击"配置教程"链接前，把当前表单状态存到 `localStorage`
- 页面初始化时检查 localStorage 有没有草稿，有就恢复
- 改动小，解决数据丢失问题

### 方案 B（中等）：检测 bfcache 恢复 + 状态修复
- 监听 `pageshow` 事件，检测 `event.persisted`
- bfcache 恢复时重新执行初始化逻辑（重新绑定事件、恢复定时器状态）
- 解决弹窗失效问题

### 方案 C（彻底）：A + B + 改跳转方式
- 不用 `target="_blank"`，改用 `window.open` 并监听返回
- 或改用 WebView 原生路由跳转
- 最可靠但改动大

## 涉及代码位置

- 表单初始化：`index.html:1764`（DOMContentLoaded）
- 配置加载：`index.html:1818`（loadConfig）
- 表单填充：`index.html:1940`（populateConfig）
- 教程链接示例：`index.html:714`（飞书）、`index.html:755`（钉钉）
- fetchWithAuth：`index.html:1062`
- Token 管理：`index.html:1051`（localStorage）
