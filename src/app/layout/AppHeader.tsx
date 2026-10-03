import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'

import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { useSession } from '@/features/auth/hooks/useSession'
import { useCartCount } from '@/features/cart/hooks/useCart'
import loginIcon from '@/shared/assets/icons/login.svg'
import { Button, buttonVariants } from '@/shared/ui/button'

import { HeaderSearch } from './HeaderSearch'

function CartLink() {
  const count = useCartCount()
  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Carrinho, ${String(count)} item(ns)` : 'Carrinho'}
      className="relative flex size-9 items-center justify-center rounded-md text-foreground outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ShoppingCart aria-hidden="true" className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}

const unavailableNav = ['Mercado', 'Criadores', 'Aprenda'] as const

export function AppHeader() {
  const { data: session } = useSession()
  const logout = useLogout()

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-[1200px] items-start justify-between gap-4 px-4 pt-6 pb-4 md:px-8 xl:px-0">
        <Link
          to="/"
          className="flex h-[34px] w-40 items-center rounded-sm text-sm font-bold tracking-[1.4px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden items-start gap-10 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="relative text-base text-foreground [&.active]:font-bold [&.active]:text-text-accent"
          >
            {({ isActive }) => (
              <>
                Início
                {isActive ? (
                  <span
                    className="absolute top-[43px] left-0 h-[3px] w-full bg-text-accent"
                    aria-hidden="true"
                  />
                ) : null}
              </>
            )}
          </Link>
          {unavailableNav.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Indisponível nesta demonstração"
              className="cursor-not-allowed text-base text-foreground"
            >
              {label}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <HeaderSearch />
          <CartLink />
          {session ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-text-secondary sm:inline">
                {session.user.displayName}
              </span>
              <Button
                type="button"
                size="sm"
                loading={logout.isPending}
                onClick={() => {
                  logout.mutate()
                }}
              >
                <img src={loginIcon} alt="" width={18} height={17} />
                Sair
              </Button>
            </>
          ) : (
            <Link to="/login" className={buttonVariants({ size: 'sm' })}>
              <img src={loginIcon} alt="" width={18} height={17} />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
