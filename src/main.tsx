import { env } from '@/app/config/env'

import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Elemento #root não encontrado em index.html')
}

/**
 * Os mocks começam antes de qualquer outro módulo do app ser carregado: o `socket.io-client`
 * guarda o `WebSocket` global na hora em que é importado, e o MSW só o substitui quando inicia.
 */
const MOCK_START_TIMEOUT_MS = 12_000

function withTimeout<T>(task: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    task,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} excedeu ${String(MOCK_START_TIMEOUT_MS)} ms.`))
      }, MOCK_START_TIMEOUT_MS)
    }),
  ])
}

async function start(root: HTMLElement): Promise<void> {
  if (env.enableMocks) {
    const { startMocking, clearBrokenMockWorkers } = await import('@/mocks/browser')
    try {
      await withTimeout(startMocking(), 'O Service Worker do MSW')
    } catch (error) {
      console.warn(error)
      await clearBrokenMockWorkers()
      await withTimeout(startMocking(), 'A segunda tentativa do MSW')
    }
  }

  const { mountApp } = await import('./bootstrap')
  mountApp(root)
}

void start(container)
