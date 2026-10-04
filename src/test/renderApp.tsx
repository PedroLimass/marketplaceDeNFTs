import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { onTestFinished } from 'vitest'

import { connectAuthToHttp } from '@/app/config/authBridge'
import { connectCartToSession } from '@/app/config/cartBridge'
import { createAppRouter } from '@/app/router/router'
// As rotas carregam estas telas sob demanda. Importá-las aqui, na coleta do arquivo, evita que a
// primeira navegação de cada teste pague a transformação do módulo (e estoure o tempo do teste).
import '@/app/router/AuthRoute'
import '@/features/account/components/AccountLayout'
import '@/features/cart/pages/CartPage'
import '@/features/orders/pages/CheckoutPage'
import '@/features/orders/pages/OrderPage'
import '@/features/profile/pages/ProfilePage'
import '@/features/wallets/pages/WalletsPage'

/** Renderiza o app inteiro (roteador + cache) numa URL, com histórico em memória. */
export async function renderAppAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  connectAuthToHttp(queryClient)
  onTestFinished(connectCartToSession(queryClient))

  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await router.load()

  return { router, queryClient, user: userEvent.setup() }
}
