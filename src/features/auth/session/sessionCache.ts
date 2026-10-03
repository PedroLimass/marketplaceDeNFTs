import type { QueryClient } from '@tanstack/react-query'

import { authKeys } from '../api/authKeys'
import { sessionQueryOptions } from '../api/sessionQuery'
import { tokenStorage } from '../storage/tokenStorage'
import { notifySessionStarted } from './sessionEvents'
import type { AuthResult } from '../types/auth'

/**
 * Dados em cache (carrinho, favoritos, pedidos) pertencem a quem os pediu.
 * Ao trocar de identidade, tudo é descartado, menos a própria sessão: ela pode
 * estar em andamento (ex.: o servidor respondeu `session_expired` à consulta dela)
 * e removê-la deixaria quem a observa esperando para sempre.
 */
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
