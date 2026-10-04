import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'kurio.coupon'
const listeners = new Set<() => void>()

function read(): string | undefined {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

let memory: string | undefined

function current(): string | undefined {
  return read() ?? memory
}

function emit(): void {
  listeners.forEach((listener) => {
    listener()
  })
}

export const couponStore = {
  get: current,
  set(code: string): void {
    memory = code
    try {
      window.sessionStorage.setItem(STORAGE_KEY, code)
    } catch {}
    emit()
  },
  clear(): void {
    memory = undefined
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    emit()
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useAppliedCoupon(): string | undefined {
  return useSyncExternalStore(
    (listener) => couponStore.subscribe(listener),
    () => couponStore.get(),
    () => undefined,
  )
}
