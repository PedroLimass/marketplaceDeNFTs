import type { QueryClient } from '@tanstack/react-query'

import type { AuthResult } from '../types/auth'

type SessionStartedListener = (queryClient: QueryClient, result: AuthResult) => void

const listeners = new Set<SessionStartedListener>()

/**
 * Permite que outras features reajam a um login/cadastro (ex.: unir o carrinho do
 * visitante) sem que `auth` precise conhecê-las. Devolve a função que cancela o registro.
 */
export function onSessionStarted(listener: SessionStartedListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionStarted(queryClient: QueryClient, result: AuthResult): void {
  listeners.forEach((listener) => {
    listener(queryClient, result)
  })
}
