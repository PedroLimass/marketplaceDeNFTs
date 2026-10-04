import { createRootRouteWithContext, createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { createElement, lazy, Suspense, type ComponentType } from 'react'

import { ensureSession } from '@/features/auth/session/ensureSession'
import { safeRedirect } from '@/features/auth/utils/safeRedirect'
import {
  featuredNftsQueryOptions,
  nftDetailQueryOptions,
  nftListQueryOptions,
} from '@/features/catalog/api/catalogQueries'
import { HomePage } from '@/features/catalog/pages/HomePage'
import { NftDetailPage } from '@/features/nft/pages/NftDetailPage'
import { searchToFilters, validateCatalogSearch } from '@/features/catalog/search/catalogSearch'

import { NotFoundPage } from '../layout/NotFoundPage'
import { RootLayout } from '../layout/RootLayout'
import type { RouterContext } from './context'
import { redirectIfAuthenticated, requireAuth } from './guards'

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    await ensureSession(context.queryClient).catch(() => null)
  },
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const noop = () => undefined

function lazyPage<Props extends object, Name extends string>(
  importer: () => Promise<Record<Name, ComponentType<Props>>>,
  name: Name,
) {
  const Page = lazy<ComponentType<Props>>(async () => ({ default: (await importer())[name] }))
  return function LazyPage(props: Props) {
    return <Suspense fallback={null}>{createElement(Page, props)}</Suspense>
  }
}

const OrderPage = lazyPage(() => import('@/features/orders/pages/OrderPage'), 'OrderPage')
const AuthRoute = lazyPage(() => import('./AuthRoute'), 'AuthRoute')

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    void context.queryClient.query(nftListQueryOptions(searchToFilters(deps.search))).catch(noop)
    void context.queryClient.query(featuredNftsQueryOptions()).catch(noop)
  },
  component: HomePage,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  loader: ({ context, params }) => {
    void context.queryClient.query(nftDetailQueryOptions(params.nftId)).catch(noop)
  },
  component: function NftRoute() {
    const { nftId } = nftRoute.useParams()
    return <NftDetailPage nftId={nftId} />
  },
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: lazyRouteComponent(() => import('@/features/cart/pages/CartPage'), 'CartPage'),
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireAuth,
  component: lazyRouteComponent(
    () => import('@/features/orders/pages/CheckoutPage'),
    'CheckoutPage',
  ),
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  beforeLoad: requireAuth,
  component: function OrderRoute() {
    const { orderId } = orderRoute.useParams()
    return <OrderPage orderId={orderId} />
  },
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  component: lazyRouteComponent(
    () => import('@/features/account/components/AccountLayout'),
    'AccountLayout',
  ),
})

const profileIndexRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/',
  component: lazyRouteComponent(
    () => import('@/features/profile/pages/ProfilePage'),
    'ProfilePage',
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: 'wallets',
  component: lazyRouteComponent(
    () => import('@/features/wallets/pages/WalletsPage'),
    'WalletsPage',
  ),
})

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

export const routeTree = rootRoute.addChildren([
  homeRoute,
  nftRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  profileRoute.addChildren([profileIndexRoute, walletsRoute]),
  loginRoute,
  signupRoute,
])
