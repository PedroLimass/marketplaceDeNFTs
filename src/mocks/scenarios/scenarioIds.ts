export const mockScenarioIds = [
  'default',
  'empty',
  'slow-network',
  'out-of-order',
  'offline',
  'server-error',
  'expired-session',
  'signup-conflict',
  'invalid-coupon',
  'checkout-price-change',
  'checkout-sold-out',
  'order-timeout',
  'payment-rejected',
] as const

export type MockScenarioId = (typeof mockScenarioIds)[number]

export function isMockScenarioId(value: unknown): value is MockScenarioId {
  return mockScenarioIds.includes(value as MockScenarioId)
}
