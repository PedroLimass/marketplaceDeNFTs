import { RouterProvider } from '@tanstack/react-router'

import { queryClient } from './config/queryClient'
import { createAppRouter } from './router/router'

const router = createAppRouter({ queryClient })

export function App() {
  return <RouterProvider router={router} />
}
