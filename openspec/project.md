# eh-mp-formatter 排版助手

## 项目概述

一个专业的 Markdown 排版工具，支持微信公众号排版、实时预览、多主题切换。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **编辑器**: CodeMirror 6
- **Markdown 解析**: markdown-it + KaTeX
- **代码高亮**: highlight.js
- **图标**: lucide-react + react-icons
- **样式**: 纯 CSS（CSS 变量系统）

## 已实现功能

### 核心功能
- Markdown 编辑器（实时预览）
- 同步滚动
- 自动保存

### 主题系统
- 18 个预览主题
- 6 个代码高亮主题
- 7 种标题样式变体
- 白天/夜间模式切换

### 编辑功能
- Markdown 快捷键（11 个）
- 格式化工具栏（8 个按钮）
- 图片上传（图床 / Base64）
- URL 抓取内容

### 图床支持
- 阿里云 OSS
- 腾讯云 COS
- 华为云 OBS
- 七牛云
- 又拍云
- 京东云
- 网易云 NOS
- AWS S3

### 其他功能
- 手机端适配
- 导出 PDF
- 复制到剪贴板
- 字数统计

## 架构模式

- 单页应用（SPA）
- 组件化开发
- CSS 变量主题系统
- localStorage 本地缓存

## 目录结构

```
src/
├── App.tsx              # 主应用组件
├── App.css              # 主样式
├── main.tsx             # 入口文件
├── components/          # 组件目录
│   ├── CodeMirrorEditor.tsx
│   ├── ThemePickerModal.tsx
│   ├── CodeStylePickerModal.tsx
│   ├── ImageHostConfigModal.tsx
│   ├── UrlFetchModal.tsx
│   └── ...
├── hooks/               # 自定义 Hooks
│   ├── useSettings.ts
│   ├── useUITheme.ts
│   ├── useImageHost.ts
│   └── useAutoSave.ts
├── themes/              # 主题配置
│   ├── index.ts
│   ├── types.ts
│   ├── amber.ts
│   └── ...
├── styles/              # 样式文件
│   ├── preview.css
│   └── heading-variants.css
└── utils/               # 工具函数
    ├── markdown.ts
    └── ...
```

## 编码规范

- TypeScript 严格模式
- ESLint + Prettier
- 函数式组件 + Hooks
- CSS 变量命名：`--theme-*`, `--bg-*`, `--text-*`

## 测试策略

- 手动测试为主
- 浏览器兼容性：Chrome, Firefox, Safari, Edge
- 移动端适配：iOS Safari, Android Chrome

## 部署方式

- 静态部署（Vercel / Netlify / GitHub Pages）
- Docker 容器化部署
