import { useQuery } from '@tanstack/react-query'

import { sessionQueryOptions } from '../api/sessionQuery'

export function useSession() {
  return useQuery(sessionQueryOptions)
}
