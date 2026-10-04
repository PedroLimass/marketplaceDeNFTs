import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/infrastructure/http/errors'
import { keepNewestVersion } from '@/infrastructure/realtime/keepNewestVersion'

export const STALE_TIME_MS = 30_000
export const GC_TIME_MS = 5 * 60_000
export const MAX_QUERY_RETRIES = 2

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false
  return isApiError(error) && error.retryable
}

export function retryDelay(attemptIndex: number): number {
  return Math.min(1_000 * 2 ** attemptIndex, 8_000)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: shouldRetryQuery,
        retryDelay,
        structuralSharing: keepNewestVersion,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
