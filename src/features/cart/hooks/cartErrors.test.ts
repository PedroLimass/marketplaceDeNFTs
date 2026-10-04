import { describe, expect, it } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'

import { describeCartError } from './cartErrors'

describe('describeCartError', () => {
  it('repete a mensagem de disponibilidade insuficiente', () => {
    expect(
      describeCartError(
        new ApiError({
          kind: 'conflict',
          code: 'insufficient_availability',
          message: 'Só restam 2 unidades.',
        }),
      ),
    ).toBe('Só restam 2 unidades.')
  })

  it.each(['network', 'timeout'] as const)('explica falha de %s', (kind) => {
    expect(describeCartError(new ApiError({ kind, message: 'x' }))).toBe(
      'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
    )
  })

  it('usa a mensagem da API nos demais erros', () => {
    expect(describeCartError(new ApiError({ kind: 'conflict', message: 'O preço mudou.' }))).toBe(
      'O preço mudou.',
    )
  })

  it('tem fallback para erro desconhecido', () => {
    expect(describeCartError(new Error('boom'))).toBe(
      'Não foi possível atualizar o carrinho. Tente novamente.',
    )
  })
})
