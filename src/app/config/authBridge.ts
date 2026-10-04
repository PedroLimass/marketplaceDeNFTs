import type { QueryClient } from '@tanstack/react-query'

import { notifySessionExpired } from '@/features/auth/session/sessionEvents'
import { endSession } from '@/features/auth/session/sessionCache'
import { tokenStorage } from '@/features/auth/storage/tokenStorage'
import { configureHttp } from '@/infrastructure/http/interceptors'

export function connectAuthToHttp(queryClient: QueryClient): void {
  configureHttp({
    getAccessToken: () => tokenStorage.get(),
    onSessionExpired: () => {
      const hadSession = tokenStorage.get() !== null
      endSession(queryClient)
      if (hadSession) notifySessionExpired()
    },
  })
}
