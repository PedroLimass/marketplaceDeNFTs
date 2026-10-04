import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { start, setupWorker } = vi.hoisted(() => {
  const start = vi.fn().mockResolvedValue(undefined)
  const setupWorker = vi.fn(() => ({ start }))
  return { start, setupWorker }
})

vi.mock('msw/browser', () => ({
  setupWorker,
}))

vi.mock('./db/mockDb', () => ({
  initMockDb: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./realtime/socketServer', () => ({
  socketHandlers: [],
  startSocketServer: vi.fn(),
}))

vi.mock('./lib/orders', () => ({
  schedulePendingOrders: vi.fn(),
}))

vi.mock('./control', () => ({
  createMockControl: vi.fn(() => ({ setScenario: vi.fn() })),
}))

import { handlers } from './handlers'
import { socketHandlers } from './realtime/socketServer'
import { clearBrokenMockWorkers, startMocking } from './browser'

describe('clearBrokenMockWorkers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não faz nada quando o navegador não tem Service Worker', async () => {
    vi.stubGlobal('navigator', {})

    await expect(clearBrokenMockWorkers()).resolves.toBeUndefined()
  })

  it('remove só os registros sem worker ativo', async () => {
    const live = { active: {}, unregister: vi.fn() }
    const broken = { active: null, unregister: vi.fn().mockResolvedValue(true) }
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([live, broken]),
      },
    })

    await clearBrokenMockWorkers()

    expect(live.unregister).not.toHaveBeenCalled()
    expect(broken.unregister).toHaveBeenCalled()
  })
})

describe('startMocking', () => {
  beforeEach(() => {
    start.mockClear()
    setupWorker.mockClear()
    window.sessionStorage.clear()
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { getRegistrations: vi.fn().mockResolvedValue([]) },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__mockControl
  })

  it('sobe o worker, o socket e o controle do mock', async () => {
    await startMocking()

    expect(setupWorker).toHaveBeenCalledWith(...handlers, ...socketHandlers)
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      }),
    )
    expect(window.__mockControl).toBeDefined()
    expect(window.sessionStorage.getItem('kurio.mock-scenario')).toBe('default')
  })
})
