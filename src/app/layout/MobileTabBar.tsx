import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Home, Search, ShoppingCart, User, type LucideIcon } from 'lucide-react'

import { useSession } from '@/features/auth/hooks/useSession'
import { useCartCount } from '@/features/cart/hooks/useCart'
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/utils'

import { isFocusedFlowPath } from '../router/guards'

const itemClass =
  'relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] leading-none text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary [&.active]:font-bold [&.active]:text-text-accent'

function TabLink({
  to,
  label,
  icon: Icon,
  exact = false,
  badge = 0,
  ariaLabel,
}: {
  to: '/' | '/cart' | '/profile' | '/login'
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number
  ariaLabel?: string
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      aria-label={ariaLabel}
      className={itemClass}
      activeProps={{ 'aria-current': 'page' }}
    >
      <span className="relative">
        <Icon aria-hidden="true" className="size-5" />
        {badge > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-ink"
          >
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      {label}
    </Link>
  )
}

/** Foca o campo de busca do Início (ele só existe nessa tela, na marcação mobile). */
function focusCatalogSearch(): void {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLInputElement>('main input[type="search"]')
    field?.scrollIntoView({ block: 'center' })
    field?.focus()
  })
}

/**
 * Barra de abas inferior do mobile (Figma "Início"), com o botão central de busca. Fica de fora
 * do pagamento e do recibo, que são fluxos com uma única ação principal.
 */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const { data: session } = useSession()
  const count = useCartCount()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  if (isDesktop || isFocusedFlowPath(pathname)) return null

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex h-[var(--mobile-bar-h)] max-w-md items-center justify-between px-4">
        <div className="flex flex-1 items-center justify-around">
          <TabLink to="/" exact label="Início" icon={Home} />
          <TabLink
            to="/cart"
            label="Carrinho"
            icon={ShoppingCart}
            badge={count}
            ariaLabel={count > 0 ? `Carrinho, ${String(count)} item(ns)` : 'Carrinho'}
          />
        </div>

        <button
          type="button"
          aria-label="Buscar NFTs"
          onClick={() => {
            if (pathname === '/') {
              focusCatalogSearch()
              return
            }
            void navigate({ to: '/' }).then(focusCatalogSearch)
          }}
          className={cn(
            '-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-ink shadow-lg outline-none',
            'ring-4 ring-ink focus-visible:ring-primary/70',
          )}
        >
          <Search aria-hidden="true" className="size-6" />
        </button>

        <div className="flex flex-1 items-center justify-around">
          {session ? (
            <TabLink to="/profile" label="Perfil" icon={User} />
          ) : (
            <TabLink to="/login" label="Entrar" icon={User} />
          )}
        </div>
      </div>
    </nav>
  )
}
