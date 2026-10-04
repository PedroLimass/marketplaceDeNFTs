import type { QueryClient } from '@tanstack/react-query'

import { authKeys } from '../api/authKeys'
import { sessionQueryOptions } from '../api/sessionQuery'
import { tokenStorage } from '../storage/tokenStorage'
import { notifySessionStarted } from './sessionEvents'
import type { AuthResult, Session, User } from '../types/auth'

function dropUserScopedQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.all[0] })
}

export function startSession(queryClient: QueryClient, result: AuthResult): void {
  tokenStorage.set(result.accessToken)
  dropUserScopedQueries(queryClient)
  queryClient.setQueryData(sessionQueryOptions.queryKey, result.session)
  notifySessionStarted(queryClient, result)
}

export function endSession(queryClient: QueryClient): void {
  tokenStorage.clear()
  dropUserScopedQueries(queryClient)
  queryClient.setQueryData(sessionQueryOptions.queryKey, null)
}

export function patchSessionUser(queryClient: QueryClient, changes: Partial<User>): void {
  queryClient.setQueryData<Session | null>(sessionQueryOptions.queryKey, (current) =>
    current ? { ...current, user: { ...current.user, ...changes } } : current,
  )
}
