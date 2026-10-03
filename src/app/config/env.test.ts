import { describe, expect, it } from 'vitest'

import { parseEnv } from './env'

describe('parseEnv', () => {
  it('aplica os valores padrão quando nada é informado', () => {
    expect(parseEnv({})).toEqual({
      apiBaseUrl: '/api',
      socketUrl: '/',
      enableMocks: true,
      mockScenario: 'default',
    })
  })

  it('converte as strings informadas', () => {
    const env = parseEnv({
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_ENABLE_MOCKS: 'false',
      VITE_MOCK_SCENARIO: 'payment-rejected',
    })

    expect(env.apiBaseUrl).toBe('https://api.example.com')
    expect(env.enableMocks).toBe(false)
    expect(env.mockScenario).toBe('payment-rejected')
  })

  it('rejeita cenário desconhecido com mensagem clara', () => {
    expect(() => parseEnv({ VITE_MOCK_SCENARIO: 'inexistente' })).toThrow(/VITE_MOCK_SCENARIO/)
  })

  it('rejeita booleano inválido', () => {
    expect(() => parseEnv({ VITE_ENABLE_MOCKS: 'talvez' })).toThrow(/VITE_ENABLE_MOCKS/)
  })
})
