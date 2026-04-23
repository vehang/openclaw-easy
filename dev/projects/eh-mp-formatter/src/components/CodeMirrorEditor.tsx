import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { htmlToMarkdown } from '../utils/markdown'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CodeMirrorEditor({ value, onChange, placeholder }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            background: 'var(--bg-surface)',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "var(--font-mono)",
          },
          '.cm-content': {
            padding: '16px 0',
            caretColor: 'var(--orange-500)',
          },
          '.cm-line': {
            padding: '0 16px',
            color: 'var(--text-secondary)',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px 0 16px',
            minWidth: '40px',
          },
          '.cm-activeLine': {
            background: 'rgba(255, 255, 255, 0.03)',
          },
          '.cm-activeLineGutter': {
            background: 'transparent',
            color: 'var(--text-tertiary)',
          },
          '.cm-selectionBackground': {
            background: 'rgba(249, 115, 22, 0.2) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            background: 'rgba(249, 115, 22, 0.25) !important',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--orange-500)',
          },
          // Markdown 语法高亮
          '.cm-header': {
            color: 'var(--orange-400)',
            fontWeight: '600',
          },
          '.cm-strong': {
            fontWeight: '700',
            color: 'var(--text-primary)',
          },
          '.cm-em': {
            fontStyle: 'italic',
          },
          '.cm-link': {
            color: 'var(--blue-500)',
          },
          '.cm-url': {
            color: 'var(--text-muted)',
          },
          '.cm-quote': {
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          },
          '.cm-list': {
            color: 'var(--orange-500)',
          },
          '.cm-meta': {
            color: 'var(--text-muted)',
          },
        }),
        EditorView.lineWrapping,
        // 自定义粘贴处理，支持富文本
        EditorView.domEventHandlers({
          paste(event, view) {
            const clipboardData = event.clipboardData
            if (!clipboardData) return false

            // 优先使用 text/html 格式（保留富文本格式）
            const html = clipboardData.getData('text/html')
            if (html) {
              event.preventDefault()
              const markdown = htmlToMarkdown(html)
              const { from, to } = view.state.selection.main
              view.dispatch({
                changes: { from, to, insert: markdown },
                selection: { anchor: from + markdown.length },
              })
              return true
            }

            // 如果没有 HTML，使用默认的纯文本处理
            return false
          },
        }),
        placeholder ? EditorView.contentAttributes.of({ 'data-placeholder': placeholder }) : [],
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 同步外部 value 变化
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div
      ref={editorRef}
      className="h-full w-full codemirror-editor"
      style={{ height: '100%' }}
    />
  )
}
