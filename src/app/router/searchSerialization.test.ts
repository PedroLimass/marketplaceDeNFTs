import { describe, expect, it } from 'vitest'

import { parseSearch, stringifySearch } from './searchSerialization'

describe('serialização da busca', () => {
  it('mantém os valores como texto, sem converter números', () => {
    expect(parseSearch('?min=1.50&q=42&page=2')).toEqual({ min: '1.50', q: '42', page: '2' })
  })

  it('transforma chave repetida em lista', () => {
    expect(parseSearch('?category=musica&category=jogos&network=polygon')).toEqual({
      category: ['musica', 'jogos'],
      network: 'polygon',
    })
  })

  it('devolve objeto vazio quando não há busca', () => {
    expect(parseSearch('')).toEqual({})
  })

  it('escreve listas como chaves repetidas e omite valores vazios', () => {
    const text = stringifySearch({
      category: ['musica', 'jogos'],
      page: 2,
      q: '',
      min: undefined,
      sort: 'price-asc',
    })

    expect(text).toBe('?category=musica&category=jogos&page=2&sort=price-asc')
  })

  it('escapa caracteres especiais e devolve texto vazio sem parâmetros', () => {
    expect(stringifySearch({ q: 'gato & rato' })).toBe('?q=gato+%26+rato')
    expect(stringifySearch({})).toBe('')
  })
})
