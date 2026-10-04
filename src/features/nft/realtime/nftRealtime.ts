import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { cartKeys } from '@/features/cart/api/cartKeys'
import type { CartItem } from '@/features/cart/types/cart'
import { catalogKeys } from '@/features/catalog/api/catalogKeys'
import { nftStatusSchema, ethAmountSchema } from '@/features/catalog/schemas/catalog.schemas'
import type { RealtimeClient } from '@/infrastructure/realtime/realtimeClient'
import type { RealtimeEnvelope } from '@/infrastructure/realtime/envelope'
import { toast } from '@/shared/lib/toast'

const nftUpdateSchema = z.object({
  price_eth: ethAmountSchema,
  available_quantity: z.number().int().nonnegative(),
  status: nftStatusSchema,
  editions: z.array(z.object({ id: z.string(), available: z.number().int().nonnegative() })),
})

type NftUpdate = z.infer<typeof nftUpdateSchema>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function patchNft(
  record: Record<string, unknown>,
  update: NftUpdate,
  version: number,
): Record<string, unknown> {
  const editions = Array.isArray(record.editions)
    ? record.editions.map((edition: unknown) => {
        if (!isRecord(edition)) return edition
        const next = update.editions.find((candidate) => candidate.id === edition.id)
        return next ? { ...edition, available: next.available } : edition
      })
    : record.editions

  return {
    ...record,
    priceEth: update.price_eth,
    availableQuantity: update.available_quantity,
    status: update.status,
    version,
    ...(editions === undefined ? {} : { editions }),
  }
}

/**
 * Percorre qualquer dado de catálogo em cache (lista, destaques, detalhe) e atualiza o NFT.
 * Só aplica se a versão do evento for maior que a que já está em cache: o estado nunca regride.
 */
function mapCatalogValue(
  value: unknown,
  nftId: string,
  update: NftUpdate,
  version: number,
): unknown {
  if (Array.isArray(value)) {
    const mapped = value.map((entry: unknown) => mapCatalogValue(entry, nftId, update, version))
    return mapped.some((entry, index) => entry !== value[index]) ? mapped : value
  }
  if (!isRecord(value)) return value

  if (value.id === nftId && typeof value.version === 'number' && 'priceEth' in value) {
    return version > value.version ? patchNft(value, update, version) : value
  }

  let changed = false
  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    const mapped = mapCatalogValue(entry, nftId, update, version)
    if (mapped !== entry) changed = true
    next[key] = mapped
  }
  return changed ? next : value
}

export function applyNftUpdate(queryClient: QueryClient, event: RealtimeEnvelope): void {
  const parsed = nftUpdateSchema.safeParse(event.data)
  if (!parsed.success) return

  const nftId = event.resource.id
  queryClient.setQueriesData({ queryKey: catalogKeys.all }, (current: unknown) =>
    mapCatalogValue(current, nftId, parsed.data, event.version),
  )

  // O carrinho e a cotação dependem de preço e estoque: o total sempre vem da API.
  const cart = queryClient.getQueryData<CartItem[]>(cartKeys.items())
  const affected = cart?.find((item) => item.nft.id === nftId && event.version > item.nft.version)
  if (affected) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    toast.info(
      `${affected.nft.name} mudou de preço ou de disponibilidade. Atualizamos o seu carrinho.`,
    )
  }
}

export function registerNftRealtime(client: RealtimeClient, queryClient: QueryClient): () => void {
  return client.subscribe('nft.updated', (event) => {
    applyNftUpdate(queryClient, event)
  })
}
