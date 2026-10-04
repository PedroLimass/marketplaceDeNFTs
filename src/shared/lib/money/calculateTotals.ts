import { addEth, minEth, mulEthByInt, subEth, sumEth } from './decimal'

export interface TotalsLine {
  priceEth: string
  quantity: number
}

export interface TotalsInput {
  lines: readonly TotalsLine[]
  discountEth?: string | undefined
  networkFeeEth?: string | undefined
}

export interface Totals {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export function calculateTotals({
  lines,
  discountEth = '0',
  networkFeeEth = '0',
}: TotalsInput): Totals {
  const subtotalEth = sumEth(lines.map((line) => mulEthByInt(line.priceEth, line.quantity)))
  const appliedDiscountEth = minEth(discountEth, subtotalEth)
  const totalEth = addEth(subEth(subtotalEth, appliedDiscountEth), networkFeeEth)

  return {
    subtotalEth,
    discountEth: appliedDiscountEth,
    networkFeeEth: addEth(networkFeeEth, '0'),
    totalEth,
  }
}
