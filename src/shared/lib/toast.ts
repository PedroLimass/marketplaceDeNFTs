import { useSyncExternalStore } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  text: string
}

const DISMISS_AFTER_MS = 6_000

let toasts: readonly Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit(next: readonly Toast[]): void {
  toasts = next
  listeners.forEach((listener) => {
    listener()
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissToast(id: number): void {
  emit(toasts.filter((toast) => toast.id !== id))
}

function push(kind: ToastKind, text: string): number {
  const id = nextId
  nextId += 1
  emit([...toasts, { id, kind, text }])
  setTimeout(() => {
    dismissToast(id)
  }, DISMISS_AFTER_MS)
  return id
}

/** Avisos curtos e acessíveis (ver `Toaster`). Fora do React, funciona em qualquer camada. */
export const toast = {
  success: (text: string) => push('success', text),
  error: (text: string) => push('error', text),
  info: (text: string) => push('info', text),
  clear: () => {
    emit([])
  },
}

export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  )
}
