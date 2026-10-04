import type { QueryClient } from '@tanstack/react-query'

import type { AuthResult } from '../types/auth'

type SessionStartedListener = (queryClient: QueryClient, result: AuthResult) => void

const listeners = new Set<SessionStartedListener>()

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

const expiredListeners = new Set<() => void>()

export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  expiredListeners.forEach((listener) => {
    listener()
  })
}
