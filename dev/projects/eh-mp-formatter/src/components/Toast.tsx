import { useState, createContext, useContext, type ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning'
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const iconMap = {
  success: 'lucide:check-circle',
  error: 'lucide:x-circle',
  warning: 'lucide:alert-circle'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon iconify" data-icon={iconMap[toast.type]}></span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
