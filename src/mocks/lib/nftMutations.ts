import { mutateDb } from '../db/mockDb'
import type { NftRecord } from '../db/types'
import { publish } from '../realtime/bus'

export function updateNft(nftId: string, recipe: (nft: NftRecord) => void): NftRecord | undefined {
  const updated = mutateDb((db) => {
    const nft = db.nfts.find((candidate) => candidate.id === nftId)
    if (!nft) return undefined

    recipe(nft)
    nft.version += 1
    return nft
  })

  if (updated) publish({ kind: 'nft', nftId })
  return updated
}
