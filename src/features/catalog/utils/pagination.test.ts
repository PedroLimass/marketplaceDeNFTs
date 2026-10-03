import { describe, expect, it } from 'vitest'

import { getPageItems } from './pagination'

describe('getPageItems', () => {
  it('lista todas as páginas quando são poucas (o catálogo tem 4)', () => {
    expect(getPageItems(1, 4)).toEqual([1, 2, 3, 4])
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('não mostra nada sem páginas', () => {
    expect(getPageItems(1, 0)).toEqual([])
  })

  it('usa reticências nos buracos e mantém primeira, última e vizinhas', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 'ellipsis-end', 20])
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20])
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis-start', 19, 20])
  })

  it('limita a página fora do intervalo', () => {
    expect(getPageItems(99, 20)).toEqual([1, 'ellipsis-start', 19, 20])
    expect(getPageItems(-3, 20)).toEqual([1, 2, 'ellipsis-end', 20])
  })
})
