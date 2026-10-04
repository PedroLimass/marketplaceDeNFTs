import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  ShoppingBag,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { cn } from '@/shared/lib/utils'

interface AvailableItem {
  label: string
  to: '/profile' | '/profile/wallets'
  icon: LucideIcon
}

const availableItems: readonly AvailableItem[] = [
  { label: 'Detalhes do perfil', to: '/profile', icon: User },
  { label: 'Carteiras', to: '/profile/wallets', icon: Wallet },
]

/** Itens do menu do Figma que ficam fora do escopo: aparecem, mas sem fingir que funcionam. */
const unavailableItems: readonly { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingBag },
  { label: 'Lista de observação', icon: Heart },
  { label: 'Ofertas', icon: Activity },
  { label: 'Downloads', icon: Download },
  { label: 'Suporte', icon: LifeBuoy },
]

const itemBase =
  'flex min-h-11 items-center gap-3 rounded-md px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary'

function useSignOut() {
  const navigate = useNavigate()
  const logout = useLogout()

  return {
    pending: logout.isPending,
    signOut: () => {
      logout.mutate(undefined, {
        onSettled: () => {
          void navigate({ to: '/' })
        },
      })
    },
  }
}

function DesktopMenu() {
  const { signOut, pending } = useSignOut()

  return (
    <nav aria-label="Conta" className="hidden flex-col lg:flex">
      <p className="px-2.5 py-2.5 text-base leading-4 font-bold text-text-primary">Meu perfil</p>
      <ul className="flex flex-col">
        {availableItems.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className={cn(
                itemBase,
                'text-foreground hover:bg-surface-card [&.active]:bg-surface-card [&.active]:font-bold [&.active]:text-text-accent',
              )}
            >
              <Icon aria-hidden="true" className="size-[18px]" />
              {label}
            </Link>
          </li>
        ))}
        {unavailableItems.map(({ label, icon: Icon }) => (
          <li key={label}>
            <span
              aria-disabled="true"
              title="Indisponível nesta demonstração"
              className={cn(itemBase, 'cursor-not-allowed text-text-secondary')}
            >
              <Icon aria-hidden="true" className="size-[18px]" />
              {label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border-soft pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={signOut}
          className={cn(
            itemBase,
            'w-full cursor-pointer text-foreground hover:bg-surface-card disabled:cursor-wait disabled:opacity-50',
          )}
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
          Sair
        </button>
      </div>
    </nav>
  )
}

/**
 * Abaixo de 1024 px o menu lateral vira abas no topo; os itens indisponíveis ficam de fora.
 * O "Sair" já está no cabeçalho, então não se repete aqui.
 */
function CompactMenu() {
  return (
    <nav aria-label="Conta" className="lg:hidden">
      <ul className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-card p-1">
        {availableItems.map(({ label, to }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="flex min-h-10 items-center rounded-md px-3 text-sm whitespace-nowrap text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary [&.active]:bg-primary [&.active]:font-bold [&.active]:text-primary-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AccountLayout() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pt-8 pb-24 md:px-8 lg:grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-x-7 xl:px-0">
      <CompactMenu />
      <DesktopMenu />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
