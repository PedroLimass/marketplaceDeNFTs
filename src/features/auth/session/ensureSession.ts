import type { QueryClient } from '@tanstack/react-query'

import { sessionQueryOptions } from '../api/sessionQuery'

export function ensureSession(queryClient: QueryClient) {
  return queryClient.query({ ...sessionQueryOptions, staleTime: 'static' })
}
