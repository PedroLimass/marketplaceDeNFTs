import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'

export const cartKeys = {
  all: ['cart'] as const,
  items: () => [...cartKeys.all, 'items'] as const,
  quotes: () => [...cartKeys.all, 'quote'] as const,
  quote: (couponCode: string | undefined, network: NetworkId) =>
    [...cartKeys.quotes(), { couponCode: couponCode ?? null, network }] as const,
}
