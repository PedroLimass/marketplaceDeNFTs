import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchWallets, saveWallet, walletKeys } from '../api/walletsApi'
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
    // A secundária "igual à principal" depende da principal: recarrega a lista inteira.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  })
}
