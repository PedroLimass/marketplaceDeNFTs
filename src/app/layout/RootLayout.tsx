import { Outlet, useRouterState } from '@tanstack/react-router'

import { cn } from '@/shared/lib/utils'
import { Toaster } from '@/shared/ui/toaster'

import { AppFooter } from './AppFooter'
import { isFocusedFlowPath } from '../router/guards'
import { AppHeader } from './AppHeader'
import { MobileTabBar } from './MobileTabBar'
import { useSessionExpiry } from './useSessionExpiry'

export function RootLayout() {
  useSessionExpiry()
  const withTabBar = useRouterState({
    select: (state) => !isFocusedFlowPath(state.location.pathname),
  })

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col bg-ink [--mobile-bar-h:0px]',
        withTabBar && 'max-md:[--mobile-bar-h:4.5rem] max-md:pb-[var(--mobile-bar-h)]',
      )}
    >
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
      <MobileTabBar />
      <Toaster />
    </div>
  )
}
