import { useState, useCallback } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initialPresent: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: []
  })

  const setValue = useCallback((newPresent: T) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newPresent,
      future: []
    }))
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev

      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, prev.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev

      const next = prev.future[0]
      const newFuture = prev.future.slice(1)

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      }
    })
  }, [])

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  return {
    value: history.present,
    setValue,
    undo,
    redo,
    canUndo,
    canRedo
  }
}
