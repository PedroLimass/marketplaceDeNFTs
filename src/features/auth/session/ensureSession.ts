import type { QueryClient } from '@tanstack/react-query'

import { sessionQueryOptions } from '../api/sessionQuery'

/**
 * Usa a sessão em cache sem revalidar; só busca quando ainda não há nada. É o que os
 * guards de rota precisam: a invalidação acontece pelos próprios fluxos (login, logout
 * e `session_expired`), não por tempo.
 */
export function ensureSession(queryClient: QueryClient) {
  return queryClient.query({ ...sessionQueryOptions, staleTime: 'static' })
}
