import { describe, expect, it } from 'vitest'

import { keepNewestVersion } from './keepNewestVersion'

describe('keepNewestVersion', () => {
  it('mantém a entidade em cache quando a resposta traz uma versão mais antiga', () => {
    const cached = { items: [{ id: 'a', version: 4, price: '2' }] }
    const response = { items: [{ id: 'a', version: 3, price: '1' }] }

    expect(keepNewestVersion(cached, response)).toEqual(cached)
  })

  it('aceita a resposta quando a versão é igual ou maior', () => {
    const cached = { items: [{ id: 'a', version: 3, price: '1' }] }
    const response = { items: [{ id: 'a', version: 5, price: '3' }] }

    expect(keepNewestVersion(cached, response)).toEqual(response)
  })

  it('funciona mesmo quando a ordem e o formato da lista mudam', () => {
    const cached = { featured: { id: 'a', version: 4, price: '2' } }
    const response = { featured: { id: 'b', version: 1 }, trending: [{ id: 'a', version: 2 }] }

    expect(keepNewestVersion(cached, response)).toEqual({
      featured: { id: 'b', version: 1 },
      trending: [{ id: 'a', version: 4, price: '2' }],
    })
  })

  it('sem dado anterior devolve a resposta', () => {
    const response = { id: 'a', version: 1 }

    expect(keepNewestVersion(undefined, response)).toBe(response)
  })

  it('reaproveita a referência quando nada mudou', () => {
    const cached = { id: 'a', version: 1, tags: ['x'] }

    expect(keepNewestVersion(cached, structuredClone(cached))).toBe(cached)
  })
})
