import { formatEth, parseEth, weiToEth } from '@/shared/lib/money'

const WEI_PER_CENTI = 10n ** 16n

export function ethToCenti(eth: string): number {
  return Number(parseEth(eth) / WEI_PER_CENTI)
}

export function centiToEth(centi: number): string {
  return formatEth(weiToEth(BigInt(Math.round(centi)) * WEI_PER_CENTI), {
    minFractionDigits: 2,
    withSymbol: false,
  })
}

export function formatPriceRangeLabel(minEth: string, maxEth: string): string {
  const comma = (value: string) =>
    formatEth(value, { minFractionDigits: 2, withSymbol: false }).replace('.', ',')

  return `Preço: ${comma(minEth)} - ${comma(maxEth)} ETH`
}

export interface PriceSelection {
  min: string | undefined
  max: string | undefined
}

export function toPriceSelection(
  [low = 0, high = 0]: number[],
  bounds: { minEth: string; maxEth: string },
): PriceSelection {
  const boundLow = ethToCenti(bounds.minEth)
  const boundHigh = ethToCenti(bounds.maxEth)

  return {
    min: low > boundLow ? centiToEth(low) : undefined,
    max: high < boundHigh ? centiToEth(high) : undefined,
  }
}

export function fromPriceSelection(
  selection: PriceSelection,
  bounds: { minEth: string; maxEth: string },
): [number, number] {
  return [
    selection.min ? ethToCenti(selection.min) : ethToCenti(bounds.minEth),
    selection.max ? ethToCenti(selection.max) : ethToCenti(bounds.maxEth),
  ]
}
