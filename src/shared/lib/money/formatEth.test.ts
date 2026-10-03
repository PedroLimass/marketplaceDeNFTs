import { describe, expect, it } from 'vitest'

import { InvalidEthAmountError } from './decimal'
import { formatEth } from './formatEth'

describe('formatEth', () => {
  it('usa duas casas mínimas e o sufixo ETH, como no layout', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('2')).toBe('2.00 ETH')
    expect(formatEth('0.5')).toBe('0.50 ETH')
  })

  it('preserva a precisão por padrão', () => {
    expect(formatEth('0.1534')).toBe('0.1534 ETH')
    expect(formatEth('0.000000000000000001')).toBe('0.000000000000000001 ETH')
  })

  it('arredonda meio para cima quando limitado', () => {
    expect(formatEth('1.2345', { maxFractionDigits: 3 })).toBe('1.235 ETH')
    expect(formatEth('1.2344', { maxFractionDigits: 3 })).toBe('1.234 ETH')
    expect(formatEth('0.999', { maxFractionDigits: 2 })).toBe('1.00 ETH')
  })

  it('respeita casas mínimas e símbolo opcionais', () => {
    expect(formatEth('3', { minFractionDigits: 0 })).toBe('3 ETH')
    expect(formatEth('3', { minFractionDigits: 4, withSymbol: false })).toBe('3.0000')
  })

  it('rejeita opções e valores inválidos', () => {
    expect(() => formatEth('1', { minFractionDigits: 5, maxFractionDigits: 2 })).toThrow(RangeError)
    expect(() => formatEth('1', { maxFractionDigits: 19 })).toThrow(RangeError)
    expect(() => formatEth('1,5')).toThrow(InvalidEthAmountError)
  })
})
