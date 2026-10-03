import { describe, expect, it } from 'vitest'

import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersToSearch,
  searchToFilters,
  validateCatalogSearch,
} from './catalogSearch'

describe('validateCatalogSearch', () => {
  it('abre com o padrão quando a URL está vazia', () => {
    const search = validateCatalogSearch({})

    expect(searchToFilters(search)).toEqual(DEFAULT_FILTERS)
  })

  it('lê valores únicos e listas, ordenando e removendo duplicatas', () => {
    const search = validateCatalogSearch({
      q: '  emerald ',
      category: ['musica', 'jogos', 'musica'],
      network: 'polygon',
      min: '0.50',
      max: '3',
      listing: 'trending',
      sort: 'price-desc',
      page: '3',
    })

    expect(search).toEqual({
      q: 'emerald',
      category: ['jogos', 'musica'],
      network: ['polygon'],
      min: '0.50',
      max: '3',
      listing: 'trending',
      sort: 'price-desc',
      page: 3,
    })
  })

  it('descarta valores inválidos em vez de lançar erro', () => {
    const search = validateCatalogSearch({
      category: ['Música!', '../etc'],
      network: ['bitcoin'],
      min: '1,5',
      max: 'abc',
      listing: 'tudo',
      sort: 'aleatorio',
      page: '-2',
    })

    expect(search).toEqual({
      q: undefined,
      category: undefined,
      network: undefined,
      min: undefined,
      max: undefined,
      listing: undefined,
      sort: undefined,
      page: undefined,
    })
  })

  it('trata página 1, aba "all" e ordem "recent" como padrão (não aparecem na URL)', () => {
    const search = validateCatalogSearch({ page: '1', listing: 'all', sort: 'recent' })

    expect(search.page).toBeUndefined()
    expect(search.listing).toBeUndefined()
    expect(search.sort).toBeUndefined()
  })

  it('troca mínimo e máximo quando vêm invertidos', () => {
    expect(validateCatalogSearch({ min: '5', max: '1.25' })).toMatchObject({
      min: '1.25',
      max: '5',
    })
  })

  it('ignora valores que não são texto', () => {
    expect(validateCatalogSearch({ q: 42, min: 1.5 })).toMatchObject({
      q: undefined,
      min: undefined,
    })
  })

  it('é idempotente: revalidar uma busca já validada não perde nada', () => {
    const once = validateCatalogSearch({
      q: 'ape',
      category: ['musica', 'arte-3d'],
      network: 'solana',
      min: '0.5',
      max: '3',
      listing: 'new',
      sort: 'name',
      page: '3',
    })

    expect(once.page).toBe(3)
    expect(validateCatalogSearch({ ...once })).toEqual(once)
  })
})

describe('filtersToSearch', () => {
  it('é o inverso de searchToFilters para qualquer estado válido', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      q: 'ape',
      categories: ['arte-3d'],
      networks: ['solana' as const],
      minPrice: '0.10',
      listing: 'new' as const,
      sort: 'name' as const,
      page: 2,
    }

    expect(searchToFilters(filtersToSearch(filters))).toEqual(filters)
  })
})

describe('countActiveFilters', () => {
  it('conta busca, categorias, redes e a faixa de preço como um filtro', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0)
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        q: 'ape',
        categories: ['a', 'b'],
        networks: ['polygon'],
        minPrice: '1',
        maxPrice: '2',
        sort: 'name',
        page: 3,
      }),
    ).toBe(5)
  })
})
