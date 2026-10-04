import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applyApiMessage } from '@/shared/lib/forms/applyApiError'
import { toast } from '@/shared/lib/toast'

import {
  connectWallet,
  disconnectWallet,
  fetchWallets,
  saveWallet,
  walletKeys,
} from '../api/walletsApi'
import type { WalletRequest, WalletRole } from '../schemas/wallet.schemas'

export const walletsQueryOptions = () =>
  queryOptions({
    queryKey: walletKeys.list(),
    queryFn: ({ signal }) => fetchWallets(signal),
  })

export function useWallets() {
  return useQuery(walletsQueryOptions())
}

export function useSaveWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ role, input }: { role: WalletRole; input: WalletRequest }) =>
      saveWallet(role, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useConnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (walletId: string) => connectWallet(walletId),
    onSuccess: () => {
      toast.success('Carteira conectada.')
      return queryClient.invalidateQueries({ queryKey: walletKeys.all })
    },
    onError: (error) => {
      toast.error(applyApiMessage(error))
    },
  })
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (walletId: string) => disconnectWallet(walletId),
    onSuccess: () => {
      toast.info('Carteira desconectada.')
      return queryClient.invalidateQueries({ queryKey: walletKeys.all })
    },
    onError: (error) => {
      toast.error(applyApiMessage(error))
    },
  })
}
