# 📐 公众号排版工具 - 专业设计规范 v1.0

## 一、设计原则

### 1.1 核心价值观
- **专业**：像企业级工具，不是demo
- **高效**：操作直观，反馈即时
- **美观**：视觉精致，细节到位
- **可靠**：状态清晰，操作可撤销

### 1.2 设计语言
```
视觉风格：现代极简 + 专业商务
核心元素：渐变 + 微动效 + 柔和阴影
品牌调性：专业、可信赖、高效
```

---

## 二、色彩系统

### 2.1 主色系（基于现有主题）

**靛青主题（默认）**
```css
--primary: #667eea → #764ba2 (渐变)
--primary-light: #818CF8
--primary-dark: #4F46E5
```

**辅助色**
```css
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### 2.2 中性色
```css
--gray-50: #F9FAFB   /* 背景浅 */
--gray-100: #F3F4F6  /* 背景中 */
--gray-200: #E5E7EB  /* 边框 */
--gray-300: #D1D5DB  /* 禁用 */
--gray-500: #6B7280  /* 文本次要 */
--gray-700: #374151  /* 文本主要 */
--gray-900: #111827  /* 文本标题 */
```

---

## 三、组件规范

### 3.1 按钮系统

**主按钮**
```css
.btn-primary {
  /* 背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* 阴影 */
  box-shadow:
    0 2px 4px rgba(102, 126, 234, 0.25),
    0 4px 12px rgba(102, 126, 234, 0.15);

  /* 圆角 */
  border-radius: 8px;

  /* 内边距 */
  padding: 8px 16px;

  /* 动画 */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(102, 126, 234, 0.3),
    0 8px 24px rgba(102, 126, 234, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow:
    0 1px 2px rgba(102, 126, 234, 0.2),
    0 2px 8px rgba(102, 126, 234, 0.1);
}
```

**次要按钮**
```css
.btn-secondary {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

**成功按钮**
```css
.btn-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow:
    0 2px 4px rgba(16, 185, 129, 0.25),
    0 4px 12px rgba(16, 185, 129, 0.15);
}
```

### 3.2 选择器（Select）

```css
.select {
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #374151;

  /* 下拉箭头 */
  background-image: url("data:image/svg+xml,...");
  background-position: right 8px center;
  background-repeat: no-repeat;

  transition: all 0.2s;
}

.select:hover {
  border-color: #D1D5DB;
}

.select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

### 3.3 卡片（Card）

```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
}
```

---

## 四、布局规范

### 4.1 间距系统

```css
/* 8px 基础单位 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;
```

### 4.2 圆角系统

```css
--radius-sm: 6px;   /* 小按钮、标签 */
--radius-md: 8px;   /* 按钮、输入框 */
--radius-lg: 12px;  /* 卡片 */
--radius-xl: 16px;  /* 大卡片、模态框 */
```

### 4.3 阴影系统

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.08);
```

---

## 五、排版系统

### 5.1 字体

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
```

### 5.2 字号

```css
--text-xs: 12px;   /* 辅助信息 */
--text-sm: 14px;   /* 正文 */
--text-base: 16px; /* 标题 */
--text-lg: 18px;   /* 大标题 */
--text-xl: 20px;   /* 页面标题 */
```

### 5.3 行高

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 六、交互规范

### 6.1 动画时长

```css
--duration-fast: 100ms;   /* 微交互 */
--duration-normal: 200ms; /* 常规动画 */
--duration-slow: 300ms;   /* 复杂动画 */
```

### 6.2 缓动函数

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### 6.3 状态反馈

**Toast 通知**
```tsx
// 成功
toast.success('已复制到剪贴板', {
  icon: '✓',
  duration: 2000
})

// 错误
toast.error('复制失败', {
  icon: '✕',
  duration: 3000
})
```

**加载状态**
```tsx
<button className="btn-loading">
  <Spinner />
  <span>处理中...</span>
</button>
```

---

## 七、界面布局

### 7.1 ASCII 原型图

**顶部工具栏**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] 公众号排版工具              [主题▼] [代码▼] [🌙]    │
│  专业 · 高效 · 美观                  [电脑|手机]  [清空]     │
└─────────────────────────────────────────────────────────────┘
```

**主内容区**
```
┌──────────────────┬──────────────────────────────────────────┐
│ Markdown         │ 预览                        [靛青] 375px │
├──────────────────┼──────────────────────────────────────────┤
│                  │                                          │
│  [编辑器区域]    │  ┌────────────────────────────────────┐  │
│                  │  │                                    │  │
│  1234 字符       │  │     预览卡片                       │  │
│                  │  │                                    │  │
│                  │  │     [渲染后的内容]                 │  │
│                  │  │                                    │  │
│                  │  └────────────────────────────────────┘  │
└──────────────────┴──────────────────────────────────────────┘
```

**底部操作栏**
```
┌─────────────────────────────────────────────────────────────┐
│ [粘贴] [导入] [导出MD]        [复制HTML] [复制纯文本]  靛青 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 组件层次

```
App
├── Header (56px)
│   ├── Logo + 品牌名
│   ├── 主题选择器
│   ├── 代码风格选择器
│   ├── 预览模式切换
│   ├── 夜间模式按钮
│   └── 清空按钮
├── Main (flex-1)
│   ├── Editor (w-1/2)
│   │   ├── Toolbar
│   │   └── CodeMirror
│   └── Preview (w-1/2)
│       ├── Toolbar
│       └── PreviewCard
└── Footer (52px)
    ├── 辅助操作
    ├── 主要操作
    └── 状态信息
```

---

## 八、功能增强建议

### 8.1 即将添加的功能

**1. 撤销/重做**
- 快捷键：Ctrl+Z / Ctrl+Shift+Z
- 工具栏按钮

**2. 自动保存**
- 本地存储
- 状态提示："✓ 已自动保存"

**3. Toast 通知系统**
- 成功/错误/警告
- 自动消失

**4. 快捷键系统**
- Ctrl+S: 保存
- Ctrl+Shift+C: 复制HTML
- Ctrl+B: 加粗
- Ctrl+I: 斜体

**5. 导入/导出**
- 导入 .md 文件
- 导出 .md / .html

### 8.2 交互细节

**按钮反馈**
```tsx
// 点击波纹效果
<button onClick={handleClickWithRipple}>
  <span className="ripple"></span>
  复制HTML
</button>
```

**加载状态**
```tsx
// 复制中
{isCopying ? (
  <button disabled>
    <Spinner size="sm" />
    复制中...
  </button>
) : (
  <button>复制HTML</button>
)}
```

---

## 九、实施优先级

### P0（立即实施）
1. ✅ 重构按钮系统（渐变 + 动画）
2. ✅ 优化工具栏布局
3. ✅ 添加 Toast 通知
4. ✅ 增强卡片样式

### P1（本周完成）
5. ⏳ 添加撤销/重做
6. ⏳ 实现自动保存
7. ⏳ 快捷键系统
8. ⏳ 品牌Logo升级

### P2（下周完成）
9. ⏳ 导入/导出功能
10. ⏳ 主题自定义
11. ⏳ 编辑器增强（行号、折叠）

---

## 十、代码实现示例

### 10.1 Toast 组件

```tsx
// src/components/Toast.tsx
import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning'
  duration?: number
}

export function Toast({ message, type, duration = 2000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '⚠'}
      </span>
      <span>{message}</span>
    </div>
  )
}
```

```css
/* Toast 样式 */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
  z-index: 9999;
}

.toast-success {
  background: #10B981;
  color: white;
}

.toast-error {
  background: #EF4444;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 10.2 品牌Logo

```tsx
// src/components/BrandLogo.tsx
export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-logo">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="8" fill="url(#logoGradient)" />
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="600"
          >
            M
          </text>
        </svg>
      </div>
      <div>
        <div className="brand-name">公众号排版工具</div>
        <div className="brand-slogan">专业 · 高效 · 美观</div>
      </div>
    </div>
  )
}
```

```css
.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-900);
}

.brand-slogan {
  font-size: 11px;
  color: var(--gray-500);
  margin-top: 2px;
}
```

---

## 十一、测试清单

### 视觉测试
- [ ] 所有按钮 hover 状态正常
- [ ] 主题切换平滑过渡
- [ ] Toast 通知动画流畅
- [ ] 卡片阴影层次清晰

### 交互测试
- [ ] 快捷键响应正确
- [ ] 撤销/重做功能正常
- [ ] 自动保存状态显示
- [ ] 复制成功有反馈

### 兼容性测试
- [ ] Chrome 最新版
- [ ] Safari 最新版
- [ ] Firefox 最新版
- [ ] Edge 最新版

---

## 十二、维护指南

### 更新流程
1. 修改设计规范文档
2. 更新 CSS 变量
3. 调整组件代码
4. 测试所有主题
5. 更新文档截图

### 版本控制
- v1.0: 初始版本（2026-03-04）
- 后续更新在此记录

---

**文档维护者**: OpenClaw Agent
**最后更新**: 2026-03-04
**状态**: ✅ 已完成
