import type { PurchaseSelection } from './usePurchaseSelection'

/** Texto que explica o limite de quantidade, anunciado quando muda. */
export function quantityHint(selection: PurchaseSelection, maxPerOrder: number): string {
  if (selection.soldOut) return 'Esta edição está esgotada.'
  if (selection.quantity < selection.maxQuantity) return ''

  return selection.edition && selection.edition.available <= maxPerOrder
    ? `Restam apenas ${String(selection.edition.available)} unidade(s) desta edição.`
    : `O máximo é de ${String(maxPerOrder)} unidades por pedido.`
}
