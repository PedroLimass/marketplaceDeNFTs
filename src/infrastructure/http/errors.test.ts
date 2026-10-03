import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, toApiError } from './errors'

const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() }

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  })
}

describe('toApiError', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'transient'],
    [500, 'transient'],
    [503, 'transient'],
    [418, 'unknown'],
  ] as const)('mapeia o status %i para %s', (status, kind) => {
    expect(toApiError(axiosErrorWithResponse(status, null)).kind).toBe(kind)
  })

  it('lê código, mensagem e erros de campo do corpo da resposta', () => {
    const error = toApiError(
      axiosErrorWithResponse(422, {
        error: {
          code: 'validation_failed',
          message: 'Dados inválidos',
          fieldErrors: { email: ['E-mail inválido'] },
        },
      }),
    )

    expect(error.kind).toBe('validation')
    expect(error.status).toBe(422)
    expect(error.code).toBe('validation_failed')
    expect(error.message).toBe('Dados inválidos')
    expect(error.fieldErrors).toEqual({ email: ['E-mail inválido'] })
  })

  it('usa mensagem padrão quando o corpo não segue o contrato', () => {
    const error = toApiError(axiosErrorWithResponse(500, '<html>oops</html>'))

    expect(error.kind).toBe('transient')
    expect(error.code).toBe('transient')
    expect(error.fieldErrors).toEqual({})
  })

  it('classifica falta de resposta como rede ou timeout', () => {
    const network = new AxiosError('Network Error', 'ERR_NETWORK', config)
    const timeout = new AxiosError('timeout', 'ECONNABORTED', config)

    expect(toApiError(network).kind).toBe('network')
    expect(toApiError(timeout).kind).toBe('timeout')
  })

  it('marca como reexecutáveis apenas falhas transitórias', () => {
    expect(toApiError(axiosErrorWithResponse(503, null)).retryable).toBe(true)
    expect(toApiError(new AxiosError('x', 'ERR_NETWORK', config)).retryable).toBe(true)
    expect(toApiError(axiosErrorWithResponse(404, null)).retryable).toBe(false)
    expect(toApiError(axiosErrorWithResponse(409, null)).retryable).toBe(false)
  })

  it('não reembrulha um ApiError existente', () => {
    const original = new ApiError({ kind: 'conflict', message: 'x' })

    expect(toApiError(original)).toBe(original)
  })

  it('converte erros desconhecidos preservando a mensagem', () => {
    expect(toApiError(new Error('boom')).message).toBe('boom')
    expect(toApiError('texto').kind).toBe('unknown')
  })
})
