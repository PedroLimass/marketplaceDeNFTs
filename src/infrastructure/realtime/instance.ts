import { env } from '@/app/config/env'

import { createRealtimeClient } from './realtimeClient'

export const realtimeClient = createRealtimeClient({ url: env.socketUrl })

export const isRealtimeConnected = (): boolean => realtimeClient.getState() === 'connected'
