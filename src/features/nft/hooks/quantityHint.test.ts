import { describe, expect, it } from 'vitest'

import type { PurchaseSelection } from './usePurchaseSelection'
import { quantityHint } from './quantityHint'

const selection = (overrides: Partial<PurchaseSelection> = {}): PurchaseSelection => ({
  edition: { id: '1/10', label: '1/10', supply: 10, available: 8, status: 'open' },
  quantity: 1,
  maxQuantity: 8,
  soldOut: false,
  selectEdition: () => undefined,
  increment: () => undefined,
  decrement: () => undefined,
  ...overrides,
})

describe('quantityHint', () => {
  it('avisa quando a edição esgotou', () => {
    expect(quantityHint(selection({ soldOut: true, maxQuantity: 0 }), 10)).toBe(
      'Esta edição está esgotada.',
    )
  })

  it('fica em silêncio enquanto ainda cabe aumentar', () => {
    expect(quantityHint(selection({ quantity: 2, maxQuantity: 8 }), 10)).toBe('')
  })

  it('explica o teto da edição quando ele é menor que o máximo do pedido', () => {
    expect(quantityHint(selection({ quantity: 8, maxQuantity: 8 }), 10)).toBe(
      'Restam apenas 8 unidade(s) desta edição.',
    )
  })

  it('explica o máximo por pedido quando a edição tem mais estoque', () => {
    expect(
      quantityHint(
        selection({
          quantity: 10,
          maxQuantity: 10,
          edition: { id: '1/50', label: '1/50', supply: 50, available: 40, status: 'open' },
        }),
        10,
      ),
    ).toBe('O máximo é de 10 unidades por pedido.')
  })

  it('usa o máximo do pedido quando não há edição selecionada', () => {
    expect(quantityHint(selection({ edition: undefined, quantity: 1, maxQuantity: 1 }), 5)).toBe(
      'O máximo é de 5 unidades por pedido.',
    )
  })
})
