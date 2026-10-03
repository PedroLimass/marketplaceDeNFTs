export const mockScenarioIds = [
  'default',
  'empty',
  'slow-network',
  'out-of-order',
  'flaky',
  'offline',
  'server-error',
  'timeout',
  'expired-session',
  'unauthorized',
  'signup-conflict',
  'invalid-coupon',
  'checkout-price-change',
  'checkout-sold-out',
  'order-timeout',
  'payment-rejected',
  'wallet-refused',
] as const

export type MockScenarioId = (typeof mockScenarioIds)[number]

export function isMockScenarioId(value: unknown): value is MockScenarioId {
  return mockScenarioIds.includes(value as MockScenarioId)
}
