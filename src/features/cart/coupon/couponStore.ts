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

/**
 * Cupom aplicado ao carrinho. Fica na sessão da aba para sobreviver a refresh e acompanhar o
 * usuário até o pagamento; o valor do desconto, porém, vem sempre da cotação da API.
 */
export const couponStore = {
  get: current,
  set(code: string): void {
    memory = code
    try {
      window.sessionStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Sem sessionStorage, o cupom vale só enquanto a página estiver aberta.
    }
    emit()
  },
  clear(): void {
    memory = undefined
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nada a remover.
    }
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
