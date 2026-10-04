import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { connectAuthToHttp } from '@/app/config/authBridge'
import { connectCartToSession } from '@/app/config/cartBridge'
import { queryClient } from '@/app/config/queryClient'
import { connectRealtime } from '@/app/config/realtimeBridge'
import { AppProviders } from '@/app/providers/AppProviders'

export function mountApp(container: HTMLElement): void {
  connectAuthToHttp(queryClient)
  connectCartToSession(queryClient)
  connectRealtime(queryClient)

  createRoot(container).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
}
