import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// O jsdom não implementa rolagem; o roteador a chama ao trocar de rota.
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  cleanup()
})
