import { useState, useMemo, useEffect } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { BrandLogo } from './components/BrandLogo'
import { useToast } from './components/Toast'
import { useHistory } from './hooks/useHistory'
import { useKeyboard } from './hooks/useKeyboard'
import { useAutoSave } from './hooks/useAutoSave'
import { useUITheme } from './hooks/useUITheme'
import { parseMarkdown } from './utils/markdown'
import { themes, applyTheme, defaultTheme } from './themes'
import type { Theme } from './themes/types'
import 'highlight.js/styles/github-dark.css'
import './styles/preview.css'
import './App.css'

const defaultMarkdown = `# 一级标题示例

这是一段普通文字，用于测试**加粗**、*斜体*、~~删除线~~和\`行内代码\`的效果。

## 二级标题：文本样式

### 强调与修饰

- **这是加粗文字**
- *这是斜体文字*
- ***加粗且斜体***
- ~~这是删除线~~
- \`这是行内代码\`

### 列表示例

无序列表：
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

有序列表：
1. 第一步
2. 第二步
3. 第三步

## 代码块示例

\`\`\`javascript
// JavaScript 代码示例
function greet(name) {
  console.log(\`Hello, \${name}!\`)
  return {
    message: 'Welcome',
    timestamp: Date.now()
  }
}

greet('World')
\`\`\`

## 引用块

> 这是一段引用文字。
>
> 引用块可以包含多行内容，用于展示重要信息或引述他人观点。

## 表格示例

| 功能 | 状态 | 说明 |
|------|:----:|------|
| Markdown 解析 | ✅ | 支持完整语法 |
| 主题切换 | ✅ | 5 套专业主题 |
| 代码高亮 | ✅ | 多语言支持 |
| 实时预览 | ✅ | 即时渲染 |

## 链接与分隔

这是一段包含[链接](https://github.com)的文字。

---

这是分隔线下方的文字。

---

*感谢使用排版助手！*
`

function App() {
  const { value: markdown, setValue: setMarkdown, undo, redo, canUndo, canRedo } = useHistory(defaultMarkdown)
  const uiTheme = useUITheme()
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const params = new URLSearchParams(window.location.search)
    const themeId = params.get('theme')
    return themes.find(t => t.id === themeId) || defaultTheme
  })
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop')

  const toast = useToast()
  const { savedAt, isSaving } = useAutoSave('markdown-content', markdown, 2000)

  const html = useMemo(() => parseMarkdown(markdown), [markdown])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  const handleThemeChange = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      applyTheme(theme)
    }
  }

  const handleClear = () => {
    if (markdown.length > 0) {
      setMarkdown('')
    }
  }

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(html).then(() => {
      toast.showToast('排版已复制，直接粘贴到公众号', 'success')
    }).catch(() => {
      toast.showToast('复制失败，请重试', 'error')
    })
  }

  const handleCopyText = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    navigator.clipboard.writeText(text).then(() => {
      toast.showToast('纯文本已复制', 'success')
    }).catch(() => {
      toast.showToast('复制失败，请重试', 'error')
    })
  }

  // 快捷键系统
  useKeyboard([
    { key: 'z', ctrlKey: true, handler: undo },
    { key: 'z', ctrlKey: true, shiftKey: true, handler: redo },
    { key: 'y', ctrlKey: true, handler: redo },
    { key: 's', ctrlKey: true, handler: () => toast.showToast('已自动保存', 'success') },
    { key: 'c', ctrlKey: true, shiftKey: true, handler: handleCopyHTML },
  ])

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ═══════════════════════════════════════════════
          顶部工具栏
          ═══════════════════════════════════════════════ */}
      <header
        className="flex items-center justify-between"
        style={{
          height: '52px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <BrandLogo />

        <div className="flex items-center gap-3">
          {/* UI 主题切换 */}
          <button
            onClick={uiTheme.toggleTheme}
            className="theme-toggle-btn"
            title={uiTheme.isDark ? '切换到浅色模式' : '切换到深色模式'}
          >
            <div className="theme-icon-wrapper">
              <span className="theme-icon-sun">
                <span className="iconify" data-icon="lucide:sun" style={{ fontSize: '18px' }}></span>
              </span>
              <span className="theme-icon-moon">
                <span className="iconify" data-icon="lucide:moon" style={{ fontSize: '18px' }}></span>
              </span>
            </div>
          </button>

          <div className="toolbar-divider" />

          {/* 主题选择 */}
          <div className="flex items-center gap-2">
            <span className="iconify icon-md" data-icon="lucide:palette" style={{ color: 'var(--text-muted)' }}></span>
            <select
              value={currentTheme.id}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="select"
              style={{ minWidth: '90px' }}
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>

          {/* 代码风格 */}
          <div className="flex items-center gap-2">
            <span className="iconify icon-md" data-icon="lucide:code-2" style={{ color: 'var(--text-muted)' }}></span>
            <select className="select" style={{ minWidth: '100px' }}>
              <option>GitHub Dark</option>
              <option>OneDark</option>
              <option>Monokai</option>
            </select>
          </div>

          <div className="toolbar-divider" />

          {/* 预览模式切换 */}
          <div className="toggle-group">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:monitor"></span>
              宽屏
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:smartphone"></span>
              手机
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* 撤销/重做 */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn btn-ghost btn-icon"
            title="撤销 (Ctrl+Z)"
          >
            <span className="iconify icon-md" data-icon="lucide:undo-2"></span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="btn btn-ghost btn-icon"
            title="重做 (Ctrl+Shift+Z)"
          >
            <span className="iconify icon-md" data-icon="lucide:redo-2"></span>
          </button>

          {/* 清空 */}
          <button
            onClick={handleClear}
            className="btn btn-danger btn-icon"
            title="清空内容"
          >
            <span className="iconify icon-md" data-icon="lucide:trash-2"></span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          主内容区
          ═══════════════════════════════════════════════ */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div
          className="w-1/2 flex flex-col"
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)'
          }}
        >
          <div className="panel-header">
            <span className="iconify icon-sm" data-icon="lucide:file-text" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></span>
            <span className="panel-title">Markdown</span>
            <div className="flex-1" />
            <span className="panel-meta">{markdown.length} 字</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeMirrorEditor
              value={markdown}
              onChange={setMarkdown}
              placeholder="在这里写 Markdown..."
            />
          </div>
        </div>

        {/* 右侧预览 */}
        <div
          className="w-1/2 flex flex-col"
          style={{ background: 'var(--bg-muted)' }}
        >
          <div className="panel-header">
            <span className="iconify icon-sm" data-icon="lucide:eye" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></span>
            <span className="panel-title">预览</span>
            <span className="panel-badge">{currentTheme.name}</span>
            <div className="flex-1" />
            <span className="panel-meta">{previewMode === 'mobile' ? '375px' : '自适应'}</span>
          </div>
          <div
            className="flex-1 overflow-auto flex justify-center"
            style={{
              padding: 'var(--space-6)',
              background: 'var(--bg-base)'
            }}
          >
            <div
              className="card"
              style={{
                width: previewMode === 'mobile' ? '375px' : '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <div
                className="overflow-auto theme-transition"
                style={{
                  padding: 'var(--space-6)',
                  maxHeight: 'calc(100vh - 180px)'
                }}
              >
                <div
                  className="mp-preview"
                  style={{ maxWidth: 'none' }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          底部操作栏
          ═══════════════════════════════════════════════ */}
      <footer
        className="flex items-center justify-between"
        style={{
          height: '48px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="iconify icon-sm" data-icon="lucide:clipboard-paste"></span>
            粘贴 Word
          </button>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="iconify icon-sm" data-icon="lucide:link"></span>
            抓取链接
          </button>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="iconify icon-sm" data-icon="lucide:download"></span>
            下载源文件
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={handleCopyHTML}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="iconify icon-sm" data-icon="lucide:copy"></span>
            复制排版
          </button>
          <button
            className="btn btn-success"
            onClick={handleCopyText}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="iconify icon-sm" data-icon="lucide:file-text"></span>
            复制文字
          </button>
        </div>

        <div className="flex items-center gap-3" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isSaving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
              保存中
            </span>
          ) : savedAt ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="iconify icon-sm" data-icon="lucide:check" style={{ color: 'var(--green-500)' }}></span>
              已保存
            </span>
          ) : null}
        </div>
      </footer>
    </div>
  )
}

export default App
