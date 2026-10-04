import { describe, expect, it, vi } from 'vitest'

import { publish, subscribe } from './bus'

describe('barramento de domínio', () => {
  it('entrega o evento a todos os assinantes e para depois do unsubscribe', () => {
    const first = vi.fn()
    const second = vi.fn()
    const stopFirst = subscribe(first)
    const stopSecond = subscribe(second)

    publish({ kind: 'nft', nftId: 'emerald-ape-042' })
    stopFirst()
    publish({ kind: 'order', orderId: 'ord_1', userId: 'usr_1' })
    stopSecond()

    expect(first).toHaveBeenCalledTimes(1)
    expect(first).toHaveBeenCalledWith({ kind: 'nft', nftId: 'emerald-ape-042' })
    expect(second).toHaveBeenCalledTimes(2)
  })
})
