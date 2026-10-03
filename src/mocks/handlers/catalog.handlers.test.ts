import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  featuredResponseSchema,
  nftDetailDtoSchema,
  nftListResponseSchema,
  type NftListResponse,
} from '@/features/catalog/schemas/catalog.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'
import { compareEth } from '@/shared/lib/money'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { catalogHandlers } from './catalog.handlers'

const server = setupServer(...catalogHandlers)
const client = createHttpClient('http://localhost/api')

async function list(query = ''): Promise<NftListResponse> {
  const { data } = await client.get<unknown>(`/nfts${query ? `?${query}` : ''}`)
  return nftListResponseSchema.parse(data)
}

const names = (page: NftListResponse) => page.items.map((item) => item.name)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
beforeEach(async () => {
  setScenario('default')
  await initMockDb()
  await resetMockDb()
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

describe('GET /nfts', () => {
  it('devolve a primeira página com 9 itens, na ordem da grade do design', async () => {
    const page = await list()

    expect(page).toMatchObject({ page: 1, page_size: 9, total: 36, total_pages: 4 })
    expect(names(page).slice(0, 3)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
    ])
    expect(page.items).toHaveLength(9)
  })

  it('expõe o preço anterior das ofertas', async () => {
    const page = await list()
    const neon = page.items.find((item) => item.id === 'neon-vessel-552')

    expect(neon).toMatchObject({ price_eth: '1.99', previous_price_eth: '2.29' })
    expect(page.items[0]?.previous_price_eth).toBeNull()
  })

  it('pagina sem repetir itens e devolve página vazia além do fim', async () => {
    const pages = await Promise.all([1, 2, 3, 4].map((n) => list(`page=${String(n)}`)))
    const ids = pages.flatMap((page) => page.items.map((item) => item.id))

    expect(ids).toHaveLength(36)
    expect(new Set(ids).size).toBe(36)
    expect((await list('page=9')).items).toEqual([])
  })

  it('filtra por múltiplas categorias e redes', async () => {
    const page = await list('category=musica&category=jogos&network=polygon&network=solana')

    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) {
      expect(['musica', 'jogos']).toContain(item.category.id)
      expect(['polygon', 'solana']).toContain(item.network)
    }
  })

  it('filtra por faixa de preço inclusiva em aritmética decimal', async () => {
    const page = await list('min_price=0.39&max_price=1.19&page_size=50')

    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) {
      expect(compareEth(item.price_eth, '0.39')).toBeGreaterThanOrEqual(0)
      expect(compareEth(item.price_eth, '1.19')).toBeLessThanOrEqual(0)
    }
    expect(names(page)).toContain('Emerald Ape #042')
    expect(names(page)).toContain('Golden Signal #160')
  })

  it('busca por nome, token e coleção', async () => {
    expect(names(await list('q=emerald%20ape'))).toContain('Emerald Ape #042')
    expect(names(await list('q=0552'))).toEqual(['Neon Vessel #552'])
    expect((await list('q=kurio%20apes')).total).toBeGreaterThan(0)
    expect((await list('q=nada-parecido')).total).toBe(0)
  })

  it('ordena por preço e por nome', async () => {
    const asc = (await list('sort=price-asc&page_size=50')).items.map((item) => item.price_eth)
    const desc = (await list('sort=price-desc&page_size=50')).items.map((item) => item.price_eth)
    const byName = names(await list('sort=name&page_size=50'))

    expect(asc[0]).toBe('0.02')
    expect(desc[0]).toBe('12.30')
    expect(asc).toEqual(asc.toSorted(compareEth))
    expect(byName).toEqual(byName.toSorted((a, b) => a.localeCompare(b, 'pt-BR')))
  })

  it('separa as abas Novos lançamentos e Em alta', async () => {
    const news = await list('listing=new&page_size=50')
    const trending = await list('listing=trending&page_size=50')

    expect(news.total).toBeGreaterThan(9)
    expect(trending.total).toBeGreaterThan(9)
    expect(news.total).toBeLessThan(36)
    expect(names(trending)).toContain('Violet Nomad #314')
  })

  it('exclui um item e restringe a uma coleção ("Mais desta coleção")', async () => {
    const page = await list('collection=kurio-apes&exclude=emerald-ape-042')

    expect(page.items.length).toBeGreaterThan(0)
    expect(names(page)).not.toContain('Emerald Ape #042')
    expect(names(page)).toContain('Cosmic Bloom #118')
    expect(page.items.every((item) => item.collection.id === 'kurio-apes')).toBe(true)
  })

  it('calcula facetas ignorando o próprio filtro e mantendo o intervalo de preços', async () => {
    const all = await list()
    const filtered = await list('network=polygon&category=musica')

    const totalCategories = all.facets.categories.reduce((sum, entry) => sum + entry.count, 0)
    const totalNetworks = all.facets.networks.reduce((sum, entry) => sum + entry.count, 0)
    expect(totalCategories).toBe(36)
    expect(totalNetworks).toBe(36)

    const polygonMusic = filtered.total
    const musicOnPolygon = filtered.facets.categories.find((entry) => entry.id === 'musica')
    const polygonAmongMusic = filtered.facets.networks.find((entry) => entry.id === 'polygon')
    expect(musicOnPolygon?.count).toBe(polygonMusic)
    expect(polygonAmongMusic?.count).toBe(polygonMusic)
    expect(filtered.facets.networks.find((entry) => entry.id === 'solana')?.count).toBeGreaterThan(
      0,
    )
    expect(filtered.facets.price_range).toEqual({ min_eth: '0.02', max_eth: '12.30' })
  })

  it('rejeita parâmetros inválidos com 422', async () => {
    await expect(list('sort=aleatorio')).rejects.toMatchObject({ kind: 'validation' })
    await expect(list('page=0')).rejects.toMatchObject({ kind: 'validation' })
    await expect(list('min_price=1,5')).rejects.toMatchObject({ kind: 'validation' })
  })

  it('devolve zero itens no cenário empty', async () => {
    setScenario('empty')

    const page = await list()

    expect(page).toMatchObject({ items: [], total: 0, total_pages: 0 })
    expect(page.facets.categories.every((entry) => entry.count === 0)).toBe(true)
  })
})

describe('GET /nfts/featured', () => {
  it('devolve o NFT em destaque e os itens em alta, sem repetir o destaque', async () => {
    const { data } = await client.get<unknown>('/nfts/featured')
    const featured = featuredResponseSchema.parse(data)

    expect(featured.featured.badge).toBe('limited')
    expect(featured.trending).toHaveLength(4)
    expect(featured.trending.map((item) => item.id)).not.toContain(featured.featured.id)
  })
})

describe('GET /nfts/:id', () => {
  it('devolve o detalhe do Emerald Ape #042 com edições e contrato', async () => {
    const { data } = await client.get<unknown>('/nfts/emerald-ape-042')
    const detail = nftDetailDtoSchema.parse(data)

    expect(detail).toMatchObject({
      name: 'Emerald Ape #042',
      price_eth: '1.19',
      collection: { name: 'Kurio Apes' },
      creator: { name: 'Nova Sato', royalty_percent: 5 },
      contract: { standard: 'ERC-721', network: 'ethereum' },
      rating: { average: 4.8, count: 19 },
      max_per_order: 10,
    })
    expect(detail.editions.map((edition) => edition.id)).toEqual(['1/1', '1/10', '1/50'])
    expect(detail.gallery).toHaveLength(4)
  })

  it('marca como esgotado o NFT sem unidades', async () => {
    const { data } = await client.get<unknown>('/nfts/sage-vessel-512')
    const detail = nftDetailDtoSchema.parse(data)

    expect(detail).toMatchObject({ status: 'sold_out', available_quantity: 0 })
    expect(detail.editions.every((edition) => edition.status === 'sold_out')).toBe(true)
  })

  it('responde 404 nft_not_found para id inexistente', async () => {
    await expect(client.get('/nfts/nao-existe')).rejects.toMatchObject({
      kind: 'not_found',
      code: 'nft_not_found',
    })
  })
})
