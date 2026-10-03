import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { isApiError } from '@/infrastructure/http/errors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { catalogHandlers } from '@/mocks/handlers/catalog.handlers'
import { scenarioHandler } from '@/mocks/handlers/scenario.handler'
import { setScenario } from '@/mocks/scenarios/current'

import { DEFAULT_FILTERS } from '../search/catalogSearch'
import type { CatalogFilters } from '../types/catalog'
import { useFeaturedNfts, useNftList } from './useCatalog'

const server = setupServer(scenarioHandler, ...catalogHandlers)

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const withFilters = (patch: Partial<CatalogFilters>): CatalogFilters => ({
  ...DEFAULT_FILTERS,
  ...patch,
})

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
beforeEach(async () => {
  await initMockDb()
  await resetMockDb()
  setScenario('default')
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

describe('useNftList', () => {
  it('carrega a primeira página e mapeia para o modelo do app', async () => {
    const { result } = renderHook(() => useNftList(DEFAULT_FILTERS), { wrapper })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toMatchObject({ total: 36, totalPages: 4, pageSize: 9 })
    expect(result.current.data?.items[0]).toMatchObject({
      name: 'Emerald Ape #042',
      priceEth: '1.19',
    })
  })

  it('devolve lista vazia no cenário empty', async () => {
    setScenario('empty')

    const { result } = renderHook(() => useNftList(DEFAULT_FILTERS), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toMatchObject({ items: [], total: 0 })
  })

  it('expõe o erro e se recupera ao tentar de novo', async () => {
    setScenario('server-error')

    const { result } = renderHook(() => useNftList(DEFAULT_FILTERS), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(isApiError(result.current.error) && result.current.error.kind).toBe('transient')

    setScenario('default')
    void result.current.refetch()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('mostra a última busca mesmo quando uma resposta antiga chega depois (out-of-order)', async () => {
    setScenario('out-of-order')

    const { result, rerender } = renderHook(
      ({ filters }: { filters: CatalogFilters }) => useNftList(filters),
      { wrapper, initialProps: { filters: withFilters({ q: 'ape' }) } },
    )
    // A 1ª requisição é a lenta (1,2 s); a 2ª, disparada logo em seguida, é a rápida (100 ms).
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true)
    })
    rerender({ filters: withFilters({ q: 'beat' }) })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      expect(result.current.isPlaceholderData).toBe(false)
    })
    const fast = result.current.data?.items.map((item) => item.name)
    expect(fast?.every((name) => name.includes('Beat'))).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 1_300))
    expect(result.current.data?.items.map((item) => item.name)).toEqual(fast)
  })
})

describe('useFeaturedNfts', () => {
  it('carrega o destaque e os itens em alta', async () => {
    const { result } = renderHook(() => useFeaturedNfts(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.featured.badge).toBe('limited')
    expect(result.current.data?.trending).toHaveLength(4)
  })
})
