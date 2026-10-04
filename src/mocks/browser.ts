import { setupWorker } from 'msw/browser'

import { env } from '@/app/config/env'

import { createMockControl } from './control'
import { initMockDb } from './db/mockDb'
import { handlers } from './handlers'
import { schedulePendingOrders } from './lib/orders'
import { socketHandlers, startSocketServer } from './realtime/socketServer'
import { resolveInitialScenario, setScenario, SCENARIO_STORAGE_KEY } from './scenarios/current'

/** Inicia o Service Worker do MSW e o banco do mock. Deve terminar antes do primeiro render. */
export async function startMocking(): Promise<void> {
  const scenario = resolveInitialScenario({
    search: window.location.search,
    storage: window.sessionStorage,
    fallback: env.mockScenario,
  })
  setScenario(scenario)
  window.sessionStorage.setItem(SCENARIO_STORAGE_KEY, scenario)

  await initMockDb({ storage: window.localStorage })

  startSocketServer()
  schedulePendingOrders()

  await setupWorker(...handlers, ...socketHandlers).start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
  })

  window.__mockControl = createMockControl({
    storage: window.sessionStorage,
    reload: () => {
      window.location.reload()
    },
  })
}
