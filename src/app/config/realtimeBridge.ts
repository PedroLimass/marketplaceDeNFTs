import type { QueryCacheNotifyEvent, QueryClient } from '@tanstack/react-query'

import { authKeys } from '@/features/auth/api/authKeys'
import { tokenStorage } from '@/features/auth/storage/tokenStorage'
import type { Session } from '@/features/auth/types/auth'
import { registerNftRealtime } from '@/features/nft/realtime/nftRealtime'
import { registerOrderRealtime } from '@/features/orders/realtime/orderRealtime'
import { realtimeClient } from '@/infrastructure/realtime/instance'

/**
 * Liga o tempo real à sessão e ao cache: conecta como visitante ou como o usuário atual,
 * reconecta quando a identidade muda, desconecta no logout e reconcilia com a API depois
 * de uma reconexão. Devolve a função que desfaz tudo.
 */
export function connectRealtime(queryClient: QueryClient): () => void {
  const stops = [
    registerNftRealtime(realtimeClient, queryClient),
    registerOrderRealtime(realtimeClient, queryClient),
    realtimeClient.onReconnect(() => {
      void queryClient.invalidateQueries({ refetchType: 'active' })
    }),
  ]

  const sync = () => {
    const session = queryClient.getQueryData<Session | null>(authKeys.session())
    // Sessão ainda sendo resolvida: espera, para não conectar como visitante por engano.
    if (session === undefined) return

    const token = session ? tokenStorage.get() : null
    realtimeClient.connect({ token, userId: token && session ? session.user.id : null })
  }

  const unsubscribe = queryClient.getQueryCache().subscribe((event: QueryCacheNotifyEvent) => {
    const key: readonly unknown[] = event.query.queryKey as readonly unknown[]
    if (key[0] === authKeys.all[0]) sync()
  })
  sync()

  return () => {
    unsubscribe()
    realtimeClient.disconnect()
    stops.forEach((stop) => {
      stop()
    })
  }
}
