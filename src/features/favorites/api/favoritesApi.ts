import { http } from '@/infrastructure/http/axios'

import { favoritesResponseSchema } from '../schemas/favorites.schemas'

export const favoritesKeys = {
  all: ['favorites'] as const,
  ids: () => [...favoritesKeys.all, 'ids'] as const,
}

export async function fetchFavoriteIds(signal: AbortSignal): Promise<string[]> {
  const { data } = await http.get<unknown>('/favorites', { signal })
  return favoritesResponseSchema.parse(data).nft_ids
}

export async function setFavorite(nftId: string, favorite: boolean): Promise<void> {
  const url = `/favorites/${encodeURIComponent(nftId)}`
  await (favorite ? http.put(url) : http.delete(url))
}
