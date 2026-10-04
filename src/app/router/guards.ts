import { redirect } from '@tanstack/react-router'

import { ensureSession } from '@/features/auth/session/ensureSession'
import { safeRedirect } from '@/features/auth/utils/safeRedirect'

import type { RouterContext } from './context'

/** Pagamento e recibo: fluxos com uma ação principal, sem a navegação inferior do mobile. */
export function isFocusedFlowPath(pathname: string): boolean {
  return pathname === '/checkout' || pathname.startsWith('/orders/')
}

export const PRIVATE_PATH_PREFIXES = ['/profile', '/checkout', '/orders'] as const

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Rota privada: sem sessão, vai para o login e volta ao destino original depois. */
export async function requireAuth({
  context,
  location,
}: {
  context: RouterContext
  location: { href: string }
}) {
  const session = await ensureSession(context.queryClient)

  if (!session) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }

  return { session }
}

/** Login e cadastro não fazem sentido para quem já está autenticado. */
export async function redirectIfAuthenticated({
  context,
  search,
}: {
  context: RouterContext
  search: { redirect?: unknown }
}) {
  const session = await ensureSession(context.queryClient)

  if (session) {
    throw redirect({ href: safeRedirect(search.redirect) ?? '/' })
  }
}
