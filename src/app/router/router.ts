import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'

import { routeTree } from './routes'

export function createAppRouter(options: { queryClient: QueryClient; history?: RouterHistory }) {
  return createRouter({
    routeTree,
    context: { queryClient: options.queryClient },
    ...(options.history ? { history: options.history } : {}),
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
