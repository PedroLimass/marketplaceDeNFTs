import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'

import { applyApiError, GENERIC_ERROR_MESSAGE } from './applyApiError'

interface Values {
  email: string
  password: string
}

const fields = ['email', 'password'] as const

describe('applyApiError', () => {
  it('atribui a primeira mensagem de cada campo conhecido e não mostra erro geral', () => {
    const setError = vi.fn()
    const error = new ApiError({
      kind: 'conflict',
      message: 'Já existe uma conta.',
      fieldErrors: { email: ['Este e-mail já está em uso.', 'outra'] },
    })

    const result = applyApiError<Values>(error, setError, fields)

    expect(setError).toHaveBeenCalledExactlyOnceWith('email', {
      type: 'server',
      message: 'Este e-mail já está em uso.',
    })
    expect(result).toBeNull()
  })

  it('devolve a mensagem do erro quando nenhum campo conhecido foi afetado', () => {
    const setError = vi.fn()
    const error = new ApiError({
      kind: 'unauthorized',
      code: 'invalid_credentials',
      message: 'E-mail ou senha incorretos.',
    })

    expect(applyApiError<Values>(error, setError, fields)).toBe('E-mail ou senha incorretos.')
    expect(setError).not.toHaveBeenCalled()
  })

  it('ignora campos desconhecidos e cai na mensagem geral', () => {
    const setError = vi.fn()
    const error = new ApiError({
      kind: 'validation',
      message: 'Os dados enviados são inválidos.',
      fieldErrors: { outro: ['x'] },
    })

    expect(applyApiError<Values>(error, setError, fields)).toBe('Os dados enviados são inválidos.')
  })

  it('usa uma mensagem genérica para erros que não vieram da API', () => {
    expect(applyApiError<Values>(new Error('boom'), vi.fn(), fields)).toBe(GENERIC_ERROR_MESSAGE)
  })
})
