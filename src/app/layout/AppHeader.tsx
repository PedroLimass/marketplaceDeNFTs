import { Link } from '@tanstack/react-router'

import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { useSession } from '@/features/auth/hooks/useSession'
import loginIcon from '@/shared/assets/icons/login.svg'

import { HeaderSearch } from './HeaderSearch'

const unavailableNav = ['Mercado', 'Criadores', 'Aprenda'] as const

const actionButtonClass =
  'flex h-[35px] items-center gap-1 rounded-md bg-primary px-3 text-base font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

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
          {session ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-text-secondary sm:inline">
                {session.user.displayName}
              </span>
              <button
                type="button"
                className={actionButtonClass}
                disabled={logout.isPending}
                onClick={() => {
                  logout.mutate()
                }}
              >
                <img src={loginIcon} alt="" width={18} height={17} />
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className={actionButtonClass}>
              <img src={loginIcon} alt="" width={18} height={17} />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
