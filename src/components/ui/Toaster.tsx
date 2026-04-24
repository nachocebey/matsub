'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

// Simple event emitter for toast notifications
type ToastListener = (toast: Omit<Toast, 'id'>) => void
const listeners = new Set<ToastListener>()

export const toast = {
  success: (message: string) => emit({ type: 'success', message }),
  error: (message: string) => emit({ type: 'error', message }),
  info: (message: string) => emit({ type: 'info', message }),
}

function emit(toast: Omit<Toast, 'id'>) {
  listeners.forEach(fn => fn(toast))
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-ocean-50 border-ocean-200 text-ocean-800',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener: ToastListener = (t) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { ...t, id }])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id))
      }, 5000)
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(x => x.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-slide-up',
              STYLES[t.type]
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm flex-1 font-medium">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
