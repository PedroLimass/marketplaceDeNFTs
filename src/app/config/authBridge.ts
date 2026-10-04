import type { QueryClient } from '@tanstack/react-query'

import { notifySessionExpired } from '@/features/auth/session/sessionEvents'
import { endSession } from '@/features/auth/session/sessionCache'
import { tokenStorage } from '@/features/auth/storage/tokenStorage'
import { configureHttp } from '@/infrastructure/http/interceptors'

/**
 * Liga a infraestrutura HTTP (que não conhece features) à autenticação:
 * envia o token em cada requisição e encerra a sessão quando o servidor a expira.
 */
export function connectAuthToHttp(queryClient: QueryClient): void {
  configureHttp({
    getAccessToken: () => tokenStorage.get(),
    onSessionExpired: () => {
      // Várias requisições em voo podem receber `session_expired` juntas: só a primeira
      // encontra um token para encerrar e avisar a interface.
      const hadSession = tokenStorage.get() !== null
      endSession(queryClient)
      if (hadSession) notifySessionExpired()
    },
  })
}
