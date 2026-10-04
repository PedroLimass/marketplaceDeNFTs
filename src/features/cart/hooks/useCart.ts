import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { isApiError } from '@/infrastructure/http/errors'

import {
  addCartItem,
  createQuote,
  fetchCart,
  removeCartItem,
  updateCartItem,
  type AddToCartInput,
} from '../api/cartApi'
import { cartKeys } from '../api/cartKeys'
import type { CartItem } from '../types/cart'

export const cartQueryOptions = () =>
  queryOptions({
    queryKey: cartKeys.items(),
    queryFn: ({ signal }) => fetchCart(signal),
  })

const NO_ITEMS: CartItem[] = []

export function useCart() {
  const query = useQuery(cartQueryOptions())

  return {
    items: query.data ?? NO_ITEMS,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCartCount(): number {
  const { items } = useCart()
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function useQuote(couponCode: string | undefined, network: NetworkId) {
  return useQuery({
    queryKey: cartKeys.quote(couponCode, network),
    queryFn: ({ signal }) => createQuote({ couponCode, network }, signal),
    placeholderData: keepPreviousData,
    retry: (count, error) => !(isApiError(error) && error.kind === 'validation') && count < 2,
  })
}

function useCartMutationOptions() {
  const queryClient = useQueryClient()

  return {
    onSuccess: (items: CartItem[] | undefined) => {
      if (items) queryClient.setQueryData(cartKeys.items(), items)
      void queryClient.invalidateQueries({ queryKey: cartKeys.quotes() })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  }
}

export function useAddToCart() {
  return useMutation({
    mutationFn: (input: AddToCartInput) => addCartItem(input),
    ...useCartMutationOptions(),
  })
}

export function useUpdateCartItem() {
  return useMutation({
    mutationFn: (input: { itemId: string; quantity?: number; acceptPrice?: true }) =>
      updateCartItem(input.itemId, {
        ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
        ...(input.acceptPrice ? { acceptPrice: true as const } : {}),
      }),
    ...useCartMutationOptions(),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const options = useCartMutationOptions()

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (_result, itemId) => {
      queryClient.setQueryData<CartItem[]>(cartKeys.items(), (current = []) =>
        current.filter((item) => item.id !== itemId),
      )
      options.onSuccess(undefined)
    },
    onError: options.onError,
  })
}
