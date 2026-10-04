export const ETH_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)
const ETH_PATTERN = /^(\d+)(?:\.(\d{1,18}))?$/

export class InvalidEthAmountError extends Error {
  constructor(value: unknown) {
    super(`Valor em ETH inválido: ${JSON.stringify(value)}`)
    this.name = 'InvalidEthAmountError'
  }
}

export function isEthString(value: unknown): value is string {
  return typeof value === 'string' && ETH_PATTERN.test(value)
}

export function parseEth(value: string): bigint {
  const match = ETH_PATTERN.exec(value)
  if (!match) throw new InvalidEthAmountError(value)

  const whole = BigInt(match[1] ?? '0')
  const fraction = BigInt((match[2] ?? '').padEnd(ETH_DECIMALS, '0'))

  return whole * WEI_PER_ETH + fraction
}

export function weiToEth(wei: bigint): string {
  if (wei < 0n) throw new RangeError('Valores em ETH não podem ser negativos')

  const whole = (wei / WEI_PER_ETH).toString()
  const fraction = (wei % WEI_PER_ETH).toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')

  return fraction ? `${whole}.${fraction}` : whole
}

export function addEth(a: string, b: string): string {
  return weiToEth(parseEth(a) + parseEth(b))
}

export function subEth(a: string, b: string): string {
  const result = parseEth(a) - parseEth(b)
  if (result < 0n) throw new RangeError(`Subtração resultaria em valor negativo: ${a} - ${b}`)

  return weiToEth(result)
}

export function sumEth(values: readonly string[]): string {
  return weiToEth(values.reduce((total, value) => total + parseEth(value), 0n))
}

export function mulEthByInt(value: string, quantity: number): string {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantidade deve ser um inteiro não negativo: ${String(quantity)}`)
  }

  return weiToEth(parseEth(value) * BigInt(quantity))
}

export function percentOfEth(value: string, basisPoints: number): string {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError(`Pontos-base devem estar entre 0 e 10000: ${String(basisPoints)}`)
  }

  return weiToEth((parseEth(value) * BigInt(basisPoints)) / 10_000n)
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const left = parseEth(a)
  const right = parseEth(b)

  if (left === right) return 0
  return left < right ? -1 : 1
}

export function minEth(a: string, b: string): string {
  return compareEth(a, b) <= 0 ? weiToEth(parseEth(a)) : weiToEth(parseEth(b))
}

export function normalizeEth(value: string): string {
  return weiToEth(parseEth(value))
}
