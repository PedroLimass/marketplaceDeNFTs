import { describe, expect, it } from 'vitest'

import {
  addEth,
  compareEth,
  InvalidEthAmountError,
  isEthString,
  minEth,
  mulEthByInt,
  normalizeEth,
  parseEth,
  percentOfEth,
  subEth,
  sumEth,
  weiToEth,
} from './decimal'

describe('parseEth / weiToEth', () => {
  it('converte para wei sem perder precisão', () => {
    expect(parseEth('1')).toBe(1_000_000_000_000_000_000n)
    expect(parseEth('0.1534')).toBe(153_400_000_000_000_000n)
    expect(parseEth('0.000000000000000001')).toBe(1n)
  })

  it('faz o caminho de volta para a forma canônica', () => {
    expect(weiToEth(parseEth('1.10'))).toBe('1.1')
    expect(weiToEth(parseEth('2.000'))).toBe('2')
    expect(weiToEth(parseEth('0.1534'))).toBe('0.1534')
    expect(weiToEth(1n)).toBe('0.000000000000000001')
    expect(weiToEth(0n)).toBe('0')
  })

  it('suporta valores muito maiores que Number.MAX_SAFE_INTEGER', () => {
    expect(addEth('9007199254740993', '0.000000000000000001')).toBe(
      '9007199254740993.000000000000000001',
    )
  })

  it.each(['', '-1', '1.', '.5', '1,5', '1e3', ' 1', 'abc', '0.0000000000000000001'])(
    'rejeita "%s"',
    (value) => {
      expect(() => parseEth(value)).toThrow(InvalidEthAmountError)
      expect(isEthString(value)).toBe(false)
    },
  )

  it('rejeita wei negativo', () => {
    expect(() => weiToEth(-1n)).toThrow(RangeError)
  })
})

describe('operações', () => {
  it('soma sem os erros de ponto flutuante', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(addEth('0.1', '0.2')).toBe('0.3')
  })

  it('subtrai e impede resultado negativo', () => {
    expect(subEth('1', '0.25')).toBe('0.75')
    expect(() => subEth('0.1', '0.2')).toThrow(RangeError)
  })

  it('soma listas, inclusive vazias', () => {
    expect(sumEth(['0.1', '0.2', '0.3'])).toBe('0.6')
    expect(sumEth([])).toBe('0')
  })

  it('multiplica por quantidade inteira', () => {
    expect(mulEthByInt('1.19', 3)).toBe('3.57')
    expect(mulEthByInt('0.333333333333333333', 3)).toBe('0.999999999999999999')
    expect(mulEthByInt('5', 0)).toBe('0')
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejeita quantidade %s', (quantity) => {
    expect(() => mulEthByInt('1', quantity)).toThrow(RangeError)
  })

  it('compara e escolhe o mínimo', () => {
    expect(compareEth('1.0', '1')).toBe(0)
    expect(compareEth('0.9', '1')).toBe(-1)
    expect(compareEth('1.1', '1')).toBe(1)
    expect(minEth('0.5', '0.25')).toBe('0.25')
    expect(minEth('0.5', '0.50')).toBe('0.5')
  })

  it('normaliza representações equivalentes', () => {
    expect(normalizeEth('01.500')).toBe('1.5')
  })
})

describe('percentOfEth', () => {
  it('calcula a fração em pontos-base com inteiros', () => {
    expect(percentOfEth('26.83', 1000)).toBe('2.683')
    expect(percentOfEth('1.19', 500)).toBe('0.0595')
    expect(percentOfEth('10', 0)).toBe('0')
    expect(percentOfEth('10', 10_000)).toBe('10')
  })

  it('trunca abaixo de 1 wei em vez de arredondar para cima', () => {
    expect(percentOfEth('0.000000000000000001', 5000)).toBe('0')
  })

  it('recusa pontos-base inválidos', () => {
    expect(() => percentOfEth('1', -1)).toThrow(RangeError)
    expect(() => percentOfEth('1', 10_001)).toThrow(RangeError)
    expect(() => percentOfEth('1', 0.5)).toThrow(RangeError)
  })
})
