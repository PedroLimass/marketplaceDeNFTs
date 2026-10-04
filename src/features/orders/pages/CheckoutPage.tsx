import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ShoppingCart, Wallet as WalletIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AccountLoadError } from '@/features/account/components/AccountStates'
import { useSession } from '@/features/auth/hooks/useSession'
import type { User } from '@/features/auth/types/auth'
import { cartKeys } from '@/features/cart/api/cartKeys'
import { CartIssues } from '@/features/cart/components/CartIssues'
import { useCart } from '@/features/cart/hooks/useCart'
import type { CartItem, Quote } from '@/features/cart/types/cart'
import { useWallets } from '@/features/wallets/hooks/useWallets'
import type { Wallet } from '@/features/wallets/types/wallet'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { fetchPendingOrders, staleQuoteOf } from '../api/ordersApi'
import { CheckoutCollectorForm } from '../components/CheckoutCollectorForm'
import { CheckoutConnectedWallets } from '../components/CheckoutConnectedWallets'
import { CheckoutNotices, type StaleChange } from '../components/CheckoutNotices'
import { CheckoutSummary } from '../components/CheckoutSummary'
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit'
import { collectorSchema } from '../schemas/order.schemas'
import { clearAttempt, readAttempt, saveAttempt } from '../storage/checkoutAttempt'

const formSchema = collectorSchema.extend({
  note: z.string().trim().max(280, 'A observação deve ter no máximo 280 caracteres.'),
})
type FormInput = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

function Centered({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-card px-6 py-16 text-center">
      {icon}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="flex max-w-md flex-col items-center gap-4 text-sm text-text-secondary">
        {children}
      </div>
    </div>
  )
}

interface CheckoutContentProps {
  user: User
  items: CartItem[]
  wallets: Wallet[]
  primary: Wallet
}

function CheckoutContent({ user, items, wallets, primary }: CheckoutContentProps) {
  const formId = useId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [walletId, setWalletId] = useState(primary.id)
  const [quote, setQuote] = useState<Quote | undefined>()
  const [stale, setStale] = useState<StaleChange | null>(null)
  const submit = useCheckoutSubmit()

  const wallet = wallets.find((candidate) => candidate.id === walletId) ?? primary
  const busy = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { display_name: user.displayName, email: user.email, note: '' },
  })

  const onSubmit = (values: FormOutput) => {
    if (busy.current || submit.isPending || !quote) return
    busy.current = true

    submit.mutate(
      {
        userId: user.id,
        quote,
        wallet,
        collector: { display_name: values.display_name, email: values.email },
        note: values.note || undefined,
      },
      {
        onSuccess: (order) => {
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => {
          const next = staleQuoteOf(error)
          if (next) setStale({ from: quote.totalEth, to: next.totalEth })
        },
        onSettled: () => {
          busy.current = false
        },
      },
    )
  }

  const acknowledgeStale = () => {
    clearAttempt()
    setStale(null)
    submit.reset()
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  }

  const selectWallet = (id: string) => {
    setWalletId(id)
    submit.reset()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-6 md:hidden">
        <Button asChild variant="outline" size="icon" className="size-[35px] rounded-full">
          <Link to="/cart" aria-label="Voltar ao carrinho">
            <ArrowLeft />
          </Link>
        </Button>
        <p className="text-[15px] leading-4 font-bold text-foreground">Pagamento com carteira</p>
      </div>

      <CartIssues items={items} />

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event)
        }}
        className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-8"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <CheckoutConnectedWallets
            wallets={wallets}
            value={wallet.id}
            disabled={submit.isPending}
            onChange={selectWallet}
          />
          <CheckoutCollectorForm
            user={user}
            wallet={wallet}
            wallets={wallets}
            disabled={submit.isPending}
            register={register}
            errors={errors}
            onSelectWallet={selectWallet}
          />
          <CheckoutNotices
            error={submit.error}
            stale={stale}
            onAcknowledgeStale={acknowledgeStale}
          />
        </div>

        <CheckoutSummary
          items={items}
          wallets={wallets}
          walletId={wallet.id}
          network={wallet.network}
          phase={submit.phase}
          submitting={submit.isPending}
          formId={formId}
          onSelectWallet={selectWallet}
          onQuote={setQuote}
        />
      </form>
    </div>
  )
}

function useResumePendingOrder(userId: string | undefined) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!userId) return
    const attempt = readAttempt(userId)
    if (!attempt) return

    const go = (orderId: string) => {
      void navigate({ to: '/orders/$orderId', params: { orderId }, replace: true })
    }

    if (attempt.orderId) {
      go(attempt.orderId)
      return
    }

    const controller = new AbortController()
    fetchPendingOrders(controller.signal)
      .then(([pending]) => {
        if (!pending) return
        saveAttempt({ ...attempt, orderId: pending.id })
        go(pending.id)
      })
      .catch(() => undefined)
    return () => {
      controller.abort()
    }
  }, [userId, navigate])
}

export function CheckoutPage() {
  const session = useSession()
  const cart = useCart()
  const wallets = useWallets()
  const user = session.data?.user

  useResumePendingOrder(user?.id)

  useEffect(() => {
    document.title = 'Pagamento · Kurio'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [])

  const primary = wallets.data?.find((wallet) => wallet.role === 'primary') ?? wallets.data?.[0]

  let body: React.ReactNode
  if (cart.isPending || wallets.isPending || !user) {
    body = (
      <div role="status" aria-label="Carregando pagamento" className="flex flex-col gap-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  } else if (cart.isError) {
    body = (
      <AccountLoadError
        error={cart.error}
        subject="o carrinho"
        onRetry={() => {
          void cart.refetch()
        }}
      />
    )
  } else if (wallets.isError) {
    body = (
      <AccountLoadError
        error={wallets.error}
        subject="suas carteiras"
        onRetry={() => {
          void wallets.refetch()
        }}
      />
    )
  } else if (cart.items.length === 0) {
    body = (
      <Centered
        icon={<ShoppingCart aria-hidden="true" className="size-10 text-text-accent" />}
        title="Seu carrinho está vazio"
      >
        <p>Adicione NFTs ao carrinho para pagar.</p>
        <Link to="/" hash="catalogo" className={buttonVariants()}>
          Explorar NFTs
        </Link>
      </Centered>
    )
  } else if (!primary) {
    body = (
      <Centered
        icon={<WalletIcon aria-hidden="true" className="size-10 text-text-accent" />}
        title="Cadastre uma carteira para continuar"
      >
        <p>Os NFTs comprados são enviados para uma das suas carteiras.</p>
        <Button asChild>
          <Link to="/profile/wallets">Cadastrar carteira</Link>
        </Button>
      </Centered>
    )
  } else {
    body = (
      <CheckoutContent user={user} items={cart.items} wallets={wallets.data} primary={primary} />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-4 pt-8 pb-24 md:px-8 xl:px-0">
      <nav aria-label="Trilha de navegação" className="hidden md:block">
        <ol className="flex flex-wrap items-center gap-2 text-[15px] leading-4 font-bold text-foreground">
          <li>
            <Link
              to="/"
              className="rounded-sm outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              to="/"
              hash="catalogo"
              className="rounded-sm outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>

      <h1 className="text-[17px] leading-4 font-bold text-text-primary">Pagamento</h1>
      {body}
    </div>
  )
}
