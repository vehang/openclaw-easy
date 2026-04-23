import type { Theme } from './types'
import { generateThemeStyles } from './types'

// ═══════════════════════════════════════════════════════════════
// 专业主题配色系统 v2.0
// 优化后的配色更柔和、更专业、更易阅读
// ═══════════════════════════════════════════════════════════════

// 1. 靛青 - 专业商务（升级版）
export const indigoTheme: Theme = {
  id: 'indigo',
  name: '靛青',
  description: '专业商务风格',
  colors: {
    primary: '#3730A3',      // 更深的靛青
    secondary: '#6366F1',    // 保持品牌靛青
    accent: '#4F46E5',       // 链接色
    background: '#FEFEFE',   // 纯净白
    text: '#1E293B',         // 深石板
    textLight: '#64748B',    // 中灰
    border: '#E2E8F0',       // 浅边框
    code: {
      inline: { background: '#EEF2FF', color: '#4338CA' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#F8FAFF',
      borderLeft: '#6366F1',
      color: '#475569'
    },
    table: {
      headerBg: '#F1F5F9',
      evenRowBg: '#F8FAFC',
      border: '#E2E8F0'
    }
  }
}

// 2. 森林 - 自然清新（升级版）
export const forestTheme: Theme = {
  id: 'forest',
  name: '森林',
  description: '自然清新风格',
  colors: {
    primary: '#166534',      // 深森林绿
    secondary: '#22C55E',    // 鲜亮绿
    accent: '#15803D',       // 链接绿
    background: '#FEFEFE',
    text: '#1E293B',
    textLight: '#64748B',
    border: '#E2E8F0',
    code: {
      inline: { background: '#F0FDF4', color: '#166534' },
      block: { background: '#14532D', color: '#DCFCE7' }
    },
    blockquote: {
      background: '#F0FDF4',
      borderLeft: '#22C55E',
      color: '#475569'
    },
    table: {
      headerBg: '#F0FDF4',
      evenRowBg: '#F8FAFC',
      border: '#E2E8F0'
    }
  }
}

// 3. 玫瑰 - 温柔浪漫（升级版）
export const roseTheme: Theme = {
  id: 'rose',
  name: '玫瑰',
  description: '温柔浪漫风格',
  colors: {
    primary: '#9F1239',      // 深玫红
    secondary: '#F43F5E',    // 鲜玫红
    accent: '#E11D48',       // 链接红
    background: '#FFFBFC',   // 微暖白
    text: '#1E293B',
    textLight: '#64748B',
    border: '#FCE7F3',
    code: {
      inline: { background: '#FFF1F2', color: '#9F1239' },
      block: { background: '#4C0519', color: '#FEE2E2' }
    },
    blockquote: {
      background: '#FFF1F2',
      borderLeft: '#F43F5E',
      color: '#475569'
    },
    table: {
      headerBg: '#FFF1F2',
      evenRowBg: '#FFFBFC',
      border: '#FCE7F3'
    }
  }
}

// 4. 琥珀 - 温暖活力（升级版）
export const amberTheme: Theme = {
  id: 'amber',
  name: '琥珀',
  description: '温暖活力风格',
  colors: {
    primary: '#92400E',      // 深琥珀
    secondary: '#F59E0B',    // 鲜亮橙
    accent: '#D97706',       // 链接橙
    background: '#FFFBF5',   // 暖白
    text: '#1E293B',
    textLight: '#64748B',
    border: '#FEF3C7',
    code: {
      inline: { background: '#FFFBEB', color: '#92400E' },
      block: { background: '#451A03', color: '#FEF3C7' }
    },
    blockquote: {
      background: '#FFFBEB',
      borderLeft: '#F59E0B',
      color: '#475569'
    },
    table: {
      headerBg: '#FFFBEB',
      evenRowBg: '#FFFBF5',
      border: '#FEF3C7'
    }
  }
}

// 5. 石板 - 极简专业（升级版）
export const slateTheme: Theme = {
  id: 'slate',
  name: '石板',
  description: '极简专业风格',
  colors: {
    primary: '#1E293B',      // 深石板
    secondary: '#64748B',    // 中石板
    accent: '#0EA5E9',       // 天蓝链接
    background: '#FAFBFC',   // 冷白
    text: '#1E293B',
    textLight: '#64748B',
    border: '#E2E8F0',
    code: {
      inline: { background: '#F1F5F9', color: '#334155' },
      block: { background: '#0F172A', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#F8FAFC',
      borderLeft: '#94A3B8',
      color: '#475569'
    },
    table: {
      headerBg: '#F1F5F9',
      evenRowBg: '#F8FAFC',
      border: '#E2E8F0'
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

export const themes: Theme[] = [
  indigoTheme,
  forestTheme,
  roseTheme,
  amberTheme,
  slateTheme
]

export function applyTheme(theme: Theme): void {
  const styleId = 'theme-styles'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = generateThemeStyles(theme)
}

export function getThemeById(id: string): Theme | undefined {
  return themes.find(t => t.id === id)
}

export const defaultTheme = indigoTheme
