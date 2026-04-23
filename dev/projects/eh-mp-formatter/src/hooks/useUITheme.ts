import { useState, useEffect, useCallback } from 'react'

export type UIThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'mp-formatter-ui-theme'

// 获取系统主题偏好
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 从 localStorage 读取保存的主题
function getStoredTheme(): UIThemeMode {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function useUITheme() {
  const [mode, setMode] = useState<UIThemeMode>(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const stored = getStoredTheme()
    return stored === 'system' ? getSystemTheme() : stored
  })

  // 应用主题到 DOM
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)

    // 添加过渡类，让切换更平滑
    root.classList.add('theme-transitioning')

    // 过渡结束后移除类
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)
  }, [])

  // 初始化主题
  useEffect(() => {
    const theme = mode === 'system' ? getSystemTheme() : mode
    setResolvedTheme(theme)
    applyTheme(theme)
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const newTheme = e.matches ? 'dark' : 'light'
        setResolvedTheme(newTheme)
        applyTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode, applyTheme])

  // 切换主题
  const setTheme = useCallback((newMode: UIThemeMode) => {
    setMode(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)

    const theme = newMode === 'system' ? getSystemTheme() : newMode
    setResolvedTheme(theme)
    applyTheme(theme)
  }, [applyTheme])

  // 在 light 和 dark 之间切换
  const toggleTheme = useCallback(() => {
    const nextMode = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextMode)
  }, [resolvedTheme, setTheme])

  return {
    mode,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: mode === 'system'
  }
}
