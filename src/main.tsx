import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { connectAuthToHttp } from '@/app/config/authBridge'
import { connectCartToSession } from '@/app/config/cartBridge'
import { env } from '@/app/config/env'
import { queryClient } from '@/app/config/queryClient'
import { AppProviders } from '@/app/providers/AppProviders'

import './index.css'

async function enableMocking(): Promise<void> {
  if (!env.enableMocks) return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Elemento #root não encontrado em index.html')
}

connectAuthToHttp(queryClient)
connectCartToSession(queryClient)

void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
})
