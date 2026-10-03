import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useEffect } from 'react'

import { NftCard } from '@/features/catalog/components/NftCard'
import { useFeaturedNfts } from '@/features/catalog/hooks/useCatalog'
import { useMediaQuery, DESKTOP_QUERY } from '@/shared/hooks/useMediaQuery'
import { isApiError } from '@/infrastructure/http/errors'
import { Button, buttonVariants } from '@/shared/ui/button'

import { CartIssues } from '../components/CartIssues'
import { CartCards, CartTable } from '../components/CartItems'
import { CartSkeleton } from '../components/CartSkeleton'
import { CartSummary } from '../components/CartSummary'
import { useCart } from '../hooks/useCart'

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-card px-6 py-16 text-center">
      <ShoppingCart aria-hidden="true" className="size-10 text-text-accent" />
      <h2 className="text-lg font-bold text-foreground">Seu carrinho está vazio</h2>
      <p className="max-w-md text-sm text-text-secondary">
        Escolha um NFT no catálogo e adicione ao carrinho para ver o resumo da compra aqui.
      </p>
      <Link to="/" hash="catalogo" className={buttonVariants()}>
        Explorar NFTs
      </Link>
    </div>
  )
}

function AlsoViewed() {
  const featured = useFeaturedNfts()
  const items = featured.data?.trending.slice(0, 5) ?? []
  if (items.length === 0) return null

  return (
    <section aria-labelledby="tambem-viram-titulo" className="flex flex-col gap-8">
      <h2
        id="tambem-viram-titulo"
        className="border-b border-border-soft pb-3 text-[15px] leading-4 font-bold text-text-primary"
      >
        Colecionadores também viram
      </h2>
      <ul className="grid grid-cols-2 gap-x-3.5 gap-y-6 min-[560px]:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CartPage() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const cart = useCart()

  useEffect(() => {
    document.title = 'Carrinho · Kurio'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-4 pt-8 pb-24 md:px-8 xl:px-0">
      <div className="flex flex-col gap-7">
        <nav aria-label="Trilha de navegação">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <li>
              <Link
                to="/"
                className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li title="Indisponível nesta demonstração">Mercado</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              Carrinho
            </li>
          </ol>
        </nav>

        <h1 className="sr-only md:not-sr-only md:text-xl md:font-bold md:text-text-primary">
          Carrinho de NFTs
        </h1>

        {cart.isPending ? (
          <CartSkeleton />
        ) : cart.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-card px-6 py-16 text-center"
          >
            <p className="max-w-md text-sm text-text-secondary">
              {isApiError(cart.error)
                ? cart.error.message
                : 'Não foi possível carregar o carrinho.'}
            </p>
            <Button
              type="button"
              onClick={() => {
                void cart.refetch()
              }}
            >
              Tentar novamente
            </Button>
          </div>
        ) : cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[86px]">
            <div className="flex min-w-0 flex-col gap-6">
              <CartIssues items={cart.items} />
              {isDesktop ? <CartTable items={cart.items} /> : <CartCards items={cart.items} />}
            </div>
            <CartSummary items={cart.items} />
          </div>
        )}
      </div>

      <AlsoViewed />
    </div>
  )
}
