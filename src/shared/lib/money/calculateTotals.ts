import { addEth, minEth, mulEthByInt, subEth, sumEth } from './decimal'

export interface TotalsLine {
  priceEth: string
  quantity: number
}

export interface TotalsInput {
  lines: readonly TotalsLine[]
  /** Desconto informado pela cotação da API. */
  discountEth?: string | undefined
  /** Taxa de rede informada pela cotação da API. */
  networkFeeEth?: string | undefined
}

export interface Totals {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

/**
 * Compõe o resumo exibido ao usuário: subtotal - desconto + taxa de rede.
 * O desconto nunca excede o subtotal, evitando totais negativos.
 */
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
