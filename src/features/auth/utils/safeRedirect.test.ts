import { describe, expect, it } from 'vitest'

import { safeRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  it('aceita caminhos internos com query e hash', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout')
    expect(safeRedirect('/?q=ape&page=2')).toBe('/?q=ape&page=2')
    expect(safeRedirect('/nfts/nft_001#detalhes')).toBe('/nfts/nft_001#detalhes')
  })

  it.each([
    'https://malicioso.example',
    '//malicioso.example',
    '/\\malicioso.example',
    'javascript:alert(1)',
    'checkout',
    '/ok\nX-Header: 1',
  ])('rejeita %j', (value) => {
    expect(safeRedirect(value)).toBeUndefined()
  })

  it('rejeita valores que não são texto', () => {
    expect(safeRedirect(undefined)).toBeUndefined()
    expect(safeRedirect(42)).toBeUndefined()
    expect(safeRedirect(['/a'])).toBeUndefined()
  })

  it('evita laço de redirecionamento para as próprias telas de autenticação', () => {
    expect(safeRedirect('/login')).toBeUndefined()
    expect(safeRedirect('/signup?redirect=/cart')).toBeUndefined()
  })
})
