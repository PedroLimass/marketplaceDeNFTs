import { Outlet } from '@tanstack/react-router'

import { Toaster } from '@/shared/ui/toaster'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
      <Toaster />
    </div>
  )
}
