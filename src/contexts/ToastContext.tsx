import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'error' | 'success'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'error' | 'success') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-24 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
              toast.type === 'error'
                ? 'border-danger/30 bg-danger text-white'
                : 'border-accent/30 bg-accent text-white',
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}
