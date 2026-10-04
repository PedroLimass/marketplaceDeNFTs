import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authKeys } from '@/features/auth/api/authKeys'
import { TOKEN_STORAGE_KEY } from '@/features/auth/storage/tokenStorage'
import type { Session } from '@/features/auth/types/auth'

const stopNft = vi.fn()
const stopOrder = vi.fn()
const stopReconnect = vi.fn()
const connect = vi.fn()
const disconnect = vi.fn()
const onReconnect = vi.fn((listener: () => void) => {
  onReconnectListener = listener
  return stopReconnect
})
let onReconnectListener: (() => void) | undefined

vi.mock('@/infrastructure/realtime/instance', () => ({
  realtimeClient: {
    connect: (...args: unknown[]) => connect(...args),
    disconnect: () => disconnect(),
    onReconnect: (listener: () => void) => onReconnect(listener),
  },
}))

vi.mock('@/features/nft/realtime/nftRealtime', () => ({
  registerNftRealtime: () => stopNft,
}))

vi.mock('@/features/orders/realtime/orderRealtime', () => ({
  registerOrderRealtime: () => stopOrder,
}))

import { connectRealtime } from './realtimeBridge'

const session: Session = {
  user: {
    id: 'usr_nova',
    username: 'nova',
    displayName: 'Nova Alves',
    email: 'nova@kurio.test',
    ensName: 'nova',
    walletNickname: null,
    avatarUrl: null,
  },
  expiresAt: '2026-12-31T00:00:00.000Z',
}

describe('connectRealtime', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    window.localStorage.clear()
    connect.mockClear()
    disconnect.mockClear()
    stopNft.mockClear()
    stopOrder.mockClear()
    stopReconnect.mockClear()
    onReconnectListener = undefined
  })

  it('espera a sessão resolver antes de conectar', () => {
    const stop = connectRealtime(queryClient)

    expect(connect).not.toHaveBeenCalled()
    stop()
  })

  it('conecta como visitante quando não há sessão', () => {
    queryClient.setQueryData(authKeys.session(), null)

    const stop = connectRealtime(queryClient)

    expect(connect).toHaveBeenCalledWith({ token: null, userId: null })
    stop()
  })

  it('conecta com o token do usuário, reconcilia no reconnect e desliga tudo', () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'tok_abc')
    queryClient.setQueryData(authKeys.session(), session)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const stop = connectRealtime(queryClient)
    expect(connect).toHaveBeenCalledWith({ token: 'tok_abc', userId: 'usr_nova' })

    onReconnectListener?.()
    expect(invalidate).toHaveBeenCalledWith({ refetchType: 'active' })

    queryClient.setQueryData(authKeys.session(), null)
    expect(connect).toHaveBeenLastCalledWith({ token: null, userId: null })

    stop()
    expect(disconnect).toHaveBeenCalled()
    expect(stopNft).toHaveBeenCalled()
    expect(stopOrder).toHaveBeenCalled()
    expect(stopReconnect).toHaveBeenCalled()
  })
})
