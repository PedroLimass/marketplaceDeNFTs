import { describe, expect, it } from 'vitest'

import {
  centiToEth,
  ethToCenti,
  formatPriceRangeLabel,
  fromPriceSelection,
  toPriceSelection,
} from './priceRange'

const bounds = { minEth: '0.02', maxEth: '12.30' }

describe('priceRange', () => {
  it('converte entre ETH e centésimos sem erro de ponto flutuante', () => {
    expect(ethToCenti('0.02')).toBe(2)
    expect(ethToCenti('12.30')).toBe(1230)
    expect(ethToCenti('1.1')).toBe(110)
    expect(centiToEth(2)).toBe('0.02')
    expect(centiToEth(1230)).toBe('12.30')
    expect(centiToEth(110)).toBe('1.10')
  })

  it('escreve o rótulo da faixa com vírgula, como no design', () => {
    expect(formatPriceRangeLabel('0.02', '12.30')).toBe('Preço: 0,02 - 12,30 ETH')
  })

  it('trata a faixa inteira como ausência de filtro', () => {
    expect(toPriceSelection([2, 1230], bounds)).toEqual({ min: undefined, max: undefined })
    expect(toPriceSelection([50, 1230], bounds)).toEqual({ min: '0.50', max: undefined })
    expect(toPriceSelection([2, 300], bounds)).toEqual({ min: undefined, max: '3.00' })
  })

  it('volta ao intervalo completo quando não há seleção', () => {
    expect(fromPriceSelection({ min: undefined, max: undefined }, bounds)).toEqual([2, 1230])
    expect(fromPriceSelection({ min: '0.50', max: '3' }, bounds)).toEqual([50, 300])
  })
})
