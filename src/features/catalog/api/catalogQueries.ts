import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { CatalogFilters } from '../types/catalog'
import { fetchFeaturedNfts, fetchNftPage } from './catalogApi'
import { catalogKeys } from './catalogKeys'

/**
 * Cada combinação de filtros tem a própria chave, então uma resposta atrasada de uma busca
 * anterior nunca sobrescreve a atual: ela cai no cache da chave antiga. O `signal` ainda
 * cancela a requisição em voo quando o usuário muda de filtro.
 * `keepPreviousData` mantém a grade anterior na tela (esmaecida) enquanto a nova carrega.
 */
export const nftListQueryOptions = (filters: CatalogFilters) =>
  queryOptions({
    queryKey: catalogKeys.list(filters),
    queryFn: ({ signal }) => fetchNftPage(filters, signal),
    placeholderData: keepPreviousData,
  })

export const featuredNftsQueryOptions = () =>
  queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
  })
