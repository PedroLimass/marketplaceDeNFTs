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
async function start(root: HTMLElement): Promise<void> {
  if (env.enableMocks) {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()
  }

  const { mountApp } = await import('./bootstrap')
  mountApp(root)
}

void start(container)
