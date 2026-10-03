import { z } from 'zod'

import { mockScenarioIds, type MockScenarioId } from '@/mocks/scenarios/scenarioIds'

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_SOCKET_URL: z.string().min(1).default('/'),
  VITE_ENABLE_MOCKS: booleanString.default(true),
  VITE_MOCK_SCENARIO: z.enum(mockScenarioIds).default('default'),
})

export interface Env {
  apiBaseUrl: string
  socketUrl: string
  enableMocks: boolean
  mockScenario: MockScenarioId
}

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Variáveis de ambiente inválidas — ${details}`)
  }

  return {
    apiBaseUrl: result.data.VITE_API_BASE_URL,
    socketUrl: result.data.VITE_SOCKET_URL,
    enableMocks: result.data.VITE_ENABLE_MOCKS,
    mockScenario: result.data.VITE_MOCK_SCENARIO,
  }
}

export const env = parseEnv(import.meta.env)
