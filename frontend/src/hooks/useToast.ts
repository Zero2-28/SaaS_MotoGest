import { useState, useCallback } from 'react'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

interface ToastState {
  toasts: ToastItem[]
  toast: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

// Hook simple para gestión de toasts sin dependencia circular
export function useToast(): ToastState {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...item, id }])
    // Auto-dismiss a los 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
