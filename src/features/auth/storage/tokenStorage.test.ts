import { afterEach, describe, expect, it, vi } from 'vitest'

import { TOKEN_STORAGE_KEY, tokenStorage } from './tokenStorage'

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('tokenStorage', () => {
  it('grava, lê e apaga o token', () => {
    tokenStorage.set('tok_1')
    expect(tokenStorage.get()).toBe('tok_1')
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('tok_1')
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })

  it('tolera armazenamento bloqueado', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })

    expect(tokenStorage.get()).toBeNull()
    expect(() => {
      tokenStorage.set('tok')
    }).not.toThrow()
    expect(() => {
      tokenStorage.clear()
    }).not.toThrow()
  })
})
