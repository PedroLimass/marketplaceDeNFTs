import { useState } from 'react'

import type { NftDetail, NftEdition } from '@/features/catalog/types/catalog'

function suggestedEdition(editions: NftEdition[]): NftEdition | undefined {
  return editions.reduce<NftEdition | undefined>(
    (best, candidate) => (!best || candidate.available > best.available ? candidate : best),
    undefined,
  )
}

export interface PurchaseSelection {
  edition: NftEdition | undefined
  quantity: number
  maxQuantity: number
  soldOut: boolean
  selectEdition: (editionId: string) => void
  increment: () => void
  decrement: () => void
}

export function usePurchaseSelection(nft: NftDetail): PurchaseSelection {
  const [editionId, setEditionId] = useState(() => suggestedEdition(nft.editions)?.id)
  const [requested, setRequested] = useState(1)

  const edition = nft.editions.find((candidate) => candidate.id === editionId) ?? nft.editions[0]
  const maxQuantity = edition ? Math.min(edition.available, nft.maxPerOrder) : 0
  const quantity = Math.max(1, Math.min(requested, maxQuantity))

  return {
    edition,
    quantity,
    maxQuantity,
    soldOut: maxQuantity === 0,
    selectEdition: (nextId) => {
      setEditionId(nextId)
      setRequested(1)
    },
    increment: () => {
      setRequested(Math.min(quantity + 1, maxQuantity))
    },
    decrement: () => {
      setRequested(Math.max(quantity - 1, 1))
    },
  }
}
