import '@testing-library/jest-dom/vitest'

import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// A API simulada tem latência própria e as telas fora do Início carregam sob demanda: o padrão de 1 s é curto.
configure({ asyncUtilTimeout: 10_000 })

// O jsdom não implementa rolagem; o roteador a chama ao trocar de rota.
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  if (typeof Element !== 'undefined') Element.prototype.scrollIntoView = vi.fn()
  // O jsdom não tem matchMedia: os testes rodam como desktop, salvo se a suíte trocar `matches`.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  // O Radix (slider) mede os elementos com ResizeObserver, que o jsdom também não tem.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

afterEach(() => {
  cleanup()
})
