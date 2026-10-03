import { describe, expect, it } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'

import { createQueryClient, retryDelay, shouldRetryQuery } from './queryClient'

describe('shouldRetryQuery', () => {
  it('repete falhas transitórias até o limite', () => {
    const error = new ApiError({ kind: 'transient', message: 'x', status: 503 })

    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(false)
  })

  it.each(['network', 'timeout'] as const)('repete falhas de %s', (kind) => {
    expect(shouldRetryQuery(0, new ApiError({ kind, message: 'x' }))).toBe(true)
  })

  it.each(['validation', 'unauthorized', 'forbidden', 'not_found', 'conflict'] as const)(
    'não repete erros de %s',
    (kind) => {
      expect(shouldRetryQuery(0, new ApiError({ kind, message: 'x' }))).toBe(false)
    },
  )

  it('não repete erros que não são ApiError', () => {
    expect(shouldRetryQuery(0, new Error('contrato inválido'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it('cresce exponencialmente com teto de 8 segundos', () => {
    expect([0, 1, 2, 3, 4, 10].map(retryDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 8_000, 8_000])
  })
})

describe('createQueryClient', () => {
  it('não repete mutations automaticamente', () => {
    const defaults = createQueryClient().getDefaultOptions()

    expect(defaults.mutations?.retry).toBe(false)
  })

  it('cria instâncias independentes', () => {
    expect(createQueryClient()).not.toBe(createQueryClient())
  })
})
