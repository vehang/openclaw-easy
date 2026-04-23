import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import TurndownService from 'turndown'

// 创建 markdown-it 实例
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

export function parseMarkdown(content: string): string {
  return md.render(content)
}

// 创建 Turndown 实例用于 HTML → Markdown 转换
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// 特殊处理代码块，保留换行和格式
turndownService.addRule('codeBlock', {
  filter: ['pre'],
  replacement: function (_content: string, node: TurndownService.Node) {
    // 获取代码内容，保持原始格式
    const codeNode = node as HTMLElement
    const codeElement = codeNode.querySelector('code')
    let codeContent = ''

    if (codeElement) {
      codeContent = codeElement.textContent || ''
    } else {
      codeContent = codeNode.textContent || ''
    }

    // 检测语言（如果有 class 如 language-javascript）
    let lang = ''
    const codeClassList = codeElement?.getAttribute('class') || ''
    const langMatch = codeClassList.match(/(?:language-|lang-)(\w+)/)
    if (langMatch) {
      lang = langMatch[1]
    }

    // 使用代码块格式，确保换行保留
    return '\n\n```' + lang + '\n' + codeContent + '\n```\n\n'
  }
})

// 处理行内代码
turndownService.addRule('inlineCode', {
  filter: function (node: TurndownService.Node) {
    return node.nodeName === 'CODE' && (node.parentNode as Node)?.nodeName !== 'PRE'
  },
  replacement: function (content: string) {
    return '`' + content + '`'
  }
})

/**
 * 将 HTML 转换为 Markdown
 * 特别优化了代码块的处理，保留换行和格式
 */
export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html)
}

export { md }
