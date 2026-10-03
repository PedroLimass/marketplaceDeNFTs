import { createRootRouteWithContext, createRoute } from '@tanstack/react-router'

import { ensureSession } from '@/features/auth/session/ensureSession'
import { safeRedirect } from '@/features/auth/utils/safeRedirect'
import {
  featuredNftsQueryOptions,
  nftListQueryOptions,
} from '@/features/catalog/api/catalogQueries'
import { HomePage } from '@/features/catalog/pages/HomePage'
import { searchToFilters, validateCatalogSearch } from '@/features/catalog/search/catalogSearch'

import { NotFoundPage } from '../layout/NotFoundPage'
import { RootLayout } from '../layout/RootLayout'
import { AuthRoute } from './AuthRoute'
import type { RouterContext } from './context'
import { redirectIfAuthenticated } from './guards'

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  // A sessão é resolvida antes da primeira tela para o cabeçalho não piscar como visitante.
  // Uma falha aqui não derruba o app: o cabeçalho tenta de novo pela própria consulta.
  beforeLoad: async ({ context }) => {
    await ensureSession(context.queryClient).catch(() => null)
  },
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const noop = () => undefined

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => ({ search }),
  // Dispara as consultas sem aguardar: a tela abre na hora com skeletons em vez de ficar
  // presa na navegação, e a primeira carga não espera a árvore de componentes montar.
  loader: ({ context, deps }) => {
    void context.queryClient.query(nftListQueryOptions(searchToFilters(deps.search))).catch(noop)
    void context.queryClient.query(featuredNftsQueryOptions()).catch(noop)
  },
  component: HomePage,
})

/**
 * O roteador mescla o resultado desta função sobre a busca bruta da URL. Por isso um
 * destino inválido precisa voltar como `redirect: undefined`, e não simplesmente sumir:
 * omitir a chave deixaria o valor original (e inseguro) passar adiante.
 */
const authSearch = (search: Record<string, unknown>): { redirect?: string | undefined } => ({
  redirect: safeRedirect(search.redirect),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: authSearch,
  beforeLoad: redirectIfAuthenticated,
  component: function LoginRoute() {
    const { redirect } = loginRoute.useSearch()
    return <AuthRoute mode="login" redirect={redirect} />
  },
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  validateSearch: authSearch,
  beforeLoad: redirectIfAuthenticated,
  component: function SignupRoute() {
    const { redirect } = signupRoute.useSearch()
    return <AuthRoute mode="signup" redirect={redirect} />
  },
})

export const routeTree = rootRoute.addChildren([homeRoute, loginRoute, signupRoute])
