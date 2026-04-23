import { useEffect, useState } from 'react'

export function useAutoSave<T>(
  key: string,
  value: T,
  delay: number = 1000
): { savedAt: Date | null; isSaving: boolean } {
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // 从本地存储加载初始值
    const saved = localStorage.getItem(key)
    if (saved) {
      setSavedAt(new Date())
    }
  }, [key])

  useEffect(() => {
    setIsSaving(true)
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value))
      setSavedAt(new Date())
      setIsSaving(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [key, value, delay])

  return { savedAt, isSaving }
}
