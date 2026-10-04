import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** `29 Jul, 2026`, como no recibo do design. */
export function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getDate())} ${MONTHS[date.getMonth()] ?? ''}, ${String(date.getFullYear())}`
}

export const explorerNames: Record<NetworkId, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}
