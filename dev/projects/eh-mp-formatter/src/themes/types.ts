export interface ThemeColor {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  textLight: string
  border: string
  code: {
    inline: { background: string; color: string }
    block: { background: string; color: string }
  }
  blockquote: {
    background: string
    borderLeft: string
    color: string
  }
  table: {
    headerBg: string
    evenRowBg: string
    border: string
  }
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColor
}

export function generateThemeStyles(theme: Theme): string {
  const c = theme.colors
  return `
.mp-preview {
  --theme-primary: ${c.primary};
  --theme-secondary: ${c.secondary};
  --theme-accent: ${c.accent};
  --theme-bg: ${c.background};
  --theme-text: ${c.text};
  --theme-text-light: ${c.textLight};
  --theme-border: ${c.border};
  --theme-code-inline-bg: ${c.code.inline.background};
  --theme-code-inline-color: ${c.code.inline.color};
  --theme-code-block-bg: ${c.code.block.background};
  --theme-code-block-color: ${c.code.block.color};
  --theme-blockquote-bg: ${c.blockquote.background};
  --theme-blockquote-border: ${c.blockquote.borderLeft};
  --theme-blockquote-color: ${c.blockquote.color};
  --theme-table-header-bg: ${c.table.headerBg};
  --theme-table-even-bg: ${c.table.evenRowBg};
  --theme-table-border: ${c.table.border};
}

.mp-preview h1 { color: var(--theme-primary); }
.mp-preview h2 { color: var(--theme-primary); border-bottom-color: var(--theme-border); }
.mp-preview h3 { color: var(--theme-primary); }
.mp-preview h4 { color: var(--theme-primary); }
.mp-preview p { color: var(--theme-text); }
.mp-preview li { color: var(--theme-text); }
.mp-preview blockquote { background: var(--theme-blockquote-bg); border-left-color: var(--theme-blockquote-border); color: var(--theme-blockquote-color); }
.mp-preview code { background: var(--theme-code-inline-bg); color: var(--theme-code-inline-color); }
.mp-preview pre { background: var(--theme-code-block-bg); color: var(--theme-code-block-color); }
.mp-preview pre code { color: var(--theme-code-block-color); }
.mp-preview th { background: var(--theme-table-header-bg); border-color: var(--theme-table-border); }
.mp-preview td { border-color: var(--theme-table-border); }
.mp-preview tr:nth-child(even) { background: var(--theme-table-even-bg); }
.mp-preview a { color: var(--theme-accent); }
.mp-preview hr { border-top-color: var(--theme-border); }
  `.trim()
}
