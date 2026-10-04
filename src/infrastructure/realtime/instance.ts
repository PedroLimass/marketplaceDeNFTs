import { env } from '@/app/config/env'

import { createRealtimeClient } from './realtimeClient'

/** Conexão única da aplicação; quem a liga à sessão e ao cache é `app/config/realtimeBridge`. */
export const realtimeClient = createRealtimeClient({ url: env.socketUrl })

export const isRealtimeConnected = (): boolean => realtimeClient.getState() === 'connected'
