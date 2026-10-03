import { Outlet } from '@tanstack/react-router'

import { AppHeader } from './AppHeader'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
