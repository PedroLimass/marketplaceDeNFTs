import { http, HttpResponse } from 'msw'

import type {
  FeaturedResponse,
  NftDetailDto,
  NftListResponse,
} from '@/features/catalog/schemas/catalog.schemas'

import { getDb } from '../db/mockDb'
import { queryCatalog, readCatalogParams } from '../lib/catalogQuery'
import { apiPath } from '../lib/apiPath'
import { errorResponse, validationErrorResponse } from '../lib/errors'
import { toNftDetailDto, toNftSummaryDto } from '../lib/nftDto'
import { getScenario } from '../scenarios/current'

const TRENDING_LIMIT = 4

export const catalogHandlers = [
  http.get(apiPath('/nfts'), ({ request }) => {
    const parsed = readCatalogParams(new URL(request.url).searchParams)
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const source = getScenario().catalog.empty ? [] : getDb().nfts
    const result = queryCatalog(source, parsed.data)

    const body: NftListResponse = {
      items: result.items.map(toNftSummaryDto),
      page: result.page,
      page_size: result.pageSize,
      total: result.total,
      total_pages: result.totalPages,
      facets: result.facets,
    }
    return HttpResponse.json(body)
  }),

  http.get(apiPath('/nfts/featured'), () => {
    const { nfts } = getDb()
    const featured = nfts.find((nft) => nft.badge === 'limited') ?? nfts[0]
    if (!featured) return errorResponse(404, 'nft_not_found', 'Nenhum NFT em destaque.')

    const trending = nfts
      .filter((nft) => nft.trendingRank !== null && nft.id !== featured.id)
      .sort((a, b) => (a.trendingRank ?? 0) - (b.trendingRank ?? 0))
      .slice(0, TRENDING_LIMIT)

    const body: FeaturedResponse = {
      featured: toNftSummaryDto(featured),
      trending: trending.map(toNftSummaryDto),
    }
    return HttpResponse.json(body)
  }),

  http.get(apiPath('/nfts/:id'), ({ params }) => {
    const nft = getDb().nfts.find((candidate) => candidate.id === params.id)
    if (!nft) return errorResponse(404, 'nft_not_found', 'Este NFT não foi encontrado.')

    const body: NftDetailDto = toNftDetailDto(nft)
    return HttpResponse.json(body)
  }),
]
