import { describe, expect, it } from 'vitest'

import { isFocusedFlowPath, isPrivatePath } from './guards'

describe('isFocusedFlowPath', () => {
  it('esconde a barra inferior no pagamento e no recibo', () => {
    expect(isFocusedFlowPath('/checkout')).toBe(true)
    expect(isFocusedFlowPath('/orders/ord_1')).toBe(true)
    expect(isFocusedFlowPath('/')).toBe(false)
    expect(isFocusedFlowPath('/cart')).toBe(false)
  })
})

describe('isPrivatePath', () => {
  it('reconhece perfil, pagamento e pedidos', () => {
    expect(isPrivatePath('/profile')).toBe(true)
    expect(isPrivatePath('/profile/wallets')).toBe(true)
    expect(isPrivatePath('/checkout')).toBe(true)
    expect(isPrivatePath('/orders/ord_1')).toBe(true)
    expect(isPrivatePath('/cart')).toBe(false)
  })
})
