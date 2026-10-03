import { describe, expect, it } from 'vitest'

import { calculateTotals } from './calculateTotals'

describe('calculateTotals', () => {
  it('calcula subtotal, desconto, taxa e total', () => {
    const totals = calculateTotals({
      lines: [
        { priceEth: '1.19', quantity: 2 },
        { priceEth: '0.1', quantity: 3 },
      ],
      discountEth: '0.25',
      networkFeeEth: '0.0042',
    })

    expect(totals).toEqual({
      subtotalEth: '2.68',
      discountEth: '0.25',
      networkFeeEth: '0.0042',
      totalEth: '2.4342',
    })
  })

  it('assume desconto e taxa zerados quando omitidos', () => {
    expect(calculateTotals({ lines: [{ priceEth: '0.5', quantity: 1 }] })).toEqual({
      subtotalEth: '0.5',
      discountEth: '0',
      networkFeeEth: '0',
      totalEth: '0.5',
    })
  })

  it('limita o desconto ao subtotal', () => {
    const totals = calculateTotals({
      lines: [{ priceEth: '0.5', quantity: 1 }],
      discountEth: '2',
      networkFeeEth: '0.01',
    })

    expect(totals.discountEth).toBe('0.5')
    expect(totals.totalEth).toBe('0.01')
  })

  it('trata carrinho vazio', () => {
    expect(calculateTotals({ lines: [] }).totalEth).toBe('0')
  })

  it('não acumula erro de ponto flutuante', () => {
    const totals = calculateTotals({
      lines: [
        { priceEth: '0.1', quantity: 1 },
        { priceEth: '0.2', quantity: 1 },
      ],
    })

    expect(totals.totalEth).toBe('0.3')
  })
})
