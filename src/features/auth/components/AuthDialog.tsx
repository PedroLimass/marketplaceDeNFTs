import { Link } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'

import closeIcon from '@/shared/assets/icons/close.svg'
import { cn } from '@/shared/lib/utils'

import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

export type AuthMode = 'login' | 'signup'

interface AuthDialogProps {
  mode: AuthMode
  redirect: string | undefined
  onClose: () => void
  onAuthenticated: () => void
}

const copy = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchPrompt: 'Novo na Kurio? Crie uma conta',
  },
  signup: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchPrompt: 'Já tem uma conta? Entrar',
  },
} as const

export function AuthDialog({ mode, redirect, onClose, onAuthenticated }: AuthDialogProps) {
  const text = copy[mode]
  const search = redirect ? { redirect } : {}

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          className={cn(
            'fixed inset-0 z-50 overflow-y-auto bg-ink px-7 pt-20 pb-6 outline-none',
            'md:inset-auto md:[--top:clamp(16px,calc(100dvh-700px),160px)] md:top-(--top) md:left-1/2 md:max-h-[calc(100dvh-var(--top)-16px)] md:w-[500px] md:-translate-x-1/2 md:rounded-lg md:bg-surface-card md:p-0',
          )}
        >
          <div className="flex h-34 items-center justify-center md:hidden">
            <Link
              to="/"
              className="rounded-sm text-[32px] font-bold tracking-[3.2px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              KURIO
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center gap-10 md:mt-0 md:px-12 md:pt-12">
            <nav aria-label="Autenticação" className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                search={search}
                aria-current={mode === 'login' ? 'page' : undefined}
                className={cn(
                  'text-xl leading-4 font-medium',
                  mode === 'login' ? 'text-text-accent' : 'text-foreground',
                )}
              >
                Entrar
              </Link>
              <span className="h-4 w-px self-stretch bg-text-coral" aria-hidden="true" />
              <Link
                to="/signup"
                search={search}
                aria-current={mode === 'signup' ? 'page' : undefined}
                className={cn(
                  'text-xl leading-4 font-medium',
                  mode === 'signup' ? 'text-text-accent' : 'text-foreground',
                )}
              >
                Criar conta
              </Link>
            </nav>

            <Dialog.Title className="text-xl leading-4 font-bold text-foreground md:sr-only">
              {text.title}
            </Dialog.Title>
            <Dialog.Description className="sr-only text-center text-[13px] leading-4 text-foreground md:not-sr-only">
              {text.description}
            </Dialog.Description>
          </div>

          <div className="mt-10 md:mt-0">
            {mode === 'login' ? (
              <LoginForm onSuccess={onAuthenticated} />
            ) : (
              <SignupForm onSuccess={onAuthenticated} />
            )}
          </div>

          <p className="mt-10 text-center text-[15px] text-text-secondary md:hidden">
            <Link
              to={mode === 'login' ? '/signup' : '/login'}
              search={search}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {text.switchPrompt}
            </Link>
          </p>

          <div className="mt-6 hidden h-[10px] bg-primary md:block" aria-hidden="true" />

          <Dialog.Close
            aria-label="Fechar"
            className="absolute top-[11px] right-3 hidden size-[18px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary md:block"
          >
            <img src={closeIcon} alt="" width={18} height={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
