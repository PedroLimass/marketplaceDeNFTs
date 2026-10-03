import { ETH_DECIMALS, parseEth, weiToEth } from './decimal'

export interface FormatEthOptions {
  /** Casas mínimas exibidas; completa com zeros à direita. Padrão: 2. */
  minFractionDigits?: number | undefined
  /**
   * Casas máximas exibidas. Acima disso o valor é arredondado (meio para cima).
   * Padrão: 18, ou seja, nenhuma perda de precisão.
   */
  maxFractionDigits?: number | undefined
  /** Anexa o sufixo "ETH". Padrão: true. */
  withSymbol?: boolean | undefined
}

function assertDigits(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > ETH_DECIMALS) {
    throw new RangeError(`${name} deve ser um inteiro entre 0 e ${String(ETH_DECIMALS)}`)
  }
}

function roundHalfUp(wei: bigint, fractionDigits: number): bigint {
  if (fractionDigits >= ETH_DECIMALS) return wei

  const unit = 10n ** BigInt(ETH_DECIMALS - fractionDigits)
  return ((wei + unit / 2n) / unit) * unit
}

export function formatEth(value: string, options: FormatEthOptions = {}): string {
  const { minFractionDigits = 2, maxFractionDigits = ETH_DECIMALS, withSymbol = true } = options

  assertDigits('minFractionDigits', minFractionDigits)
  assertDigits('maxFractionDigits', maxFractionDigits)
  if (minFractionDigits > maxFractionDigits) {
    throw new RangeError('minFractionDigits não pode exceder maxFractionDigits')
  }

  const canonical = weiToEth(roundHalfUp(parseEth(value), maxFractionDigits))
  const [whole = '0', fraction = ''] = canonical.split('.')
  const amount =
    minFractionDigits === 0 && fraction === ''
      ? whole
      : `${whole}.${fraction.padEnd(minFractionDigits, '0')}`

  return withSymbol ? `${amount} ETH` : amount
}
