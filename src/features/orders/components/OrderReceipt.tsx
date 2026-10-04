import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { networkLabels } from '@/features/catalog/constants'
import { shortenAddress } from '@/shared/lib/address'
import { formatEth } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'

import thankYouIcon from '../assets/thank-you.svg'
import type { Order } from '../types/order'
import { explorerNames, formatReceiptDate } from '../utils/format'

function Meta({ label, children, title }: { label: string; children: string; title?: string }) {
  return (
    <div className="flex min-w-0 flex-col text-text-secondary">
      <dt className="text-sm leading-4 font-bold">{label}</dt>
      <dd title={title} className="truncate text-[15px] leading-normal font-normal">
        {children}
      </dd>
    </div>
  )
}

export function OrderReceipt({ order }: { order: Order }) {
  const { transaction } = order
  const explorer = explorerNames[order.network]

  return (
    <article
      role="dialog"
      aria-modal="true"
      aria-labelledby="recibo-titulo"
      className="relative flex w-full max-w-[578px] flex-col overflow-hidden bg-surface-card"
    >
      <Link
        to="/"
        aria-label="Fechar recibo e voltar ao início"
        className="absolute top-4 right-3.5 z-10 inline-flex size-8 items-center justify-center text-primary outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X aria-hidden="true" className="size-[18px]" />
      </Link>

      <header className="flex h-[156px] flex-col items-center justify-center gap-4 px-6 text-center">
        <img src={thankYouIcon} alt="" width={65.1639} height={80} className="shrink-0" />
        <h1 id="recibo-titulo" className="text-base leading-4 font-bold text-text-secondary">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <div className="h-px bg-primary" />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-6 py-3 sm:flex sm:h-[65px] sm:items-center sm:justify-between sm:gap-0 sm:px-9 sm:py-1">
        <Meta label="ID da transação" title={transaction?.hash ?? ''}>
          {transaction ? shortenAddress(transaction.hash) : '—'}
        </Meta>
        <div aria-hidden="true" className="hidden h-8 w-px bg-border-soft sm:block" />
        <Meta label="Data">{formatReceiptDate(order.resolvedAt ?? order.createdAt)}</Meta>
        <div aria-hidden="true" className="hidden h-8 w-px bg-border-soft sm:block" />
        <Meta label="Total">{formatEth(order.totalEth, { minFractionDigits: 3 })}</Meta>
        <div aria-hidden="true" className="hidden h-8 w-px bg-border-soft sm:block" />
        <Meta label="Carteira">{order.wallet.label}</Meta>
      </dl>

      <div className="h-px bg-primary" />

      <section
        aria-labelledby="detalhes-titulo"
        className="flex flex-col gap-3 px-5 pt-5 pb-6 sm:px-11"
      >
        <h2 id="detalhes-titulo" className="text-[15px] leading-4 font-bold text-foreground">
          Detalhes da transação
        </h2>

        <div className="flex items-center justify-between text-base leading-4">
          <span className="font-bold text-foreground">NFTs</span>
          <div className="flex gap-12 font-bold text-foreground">
            <span>Edições</span>
            <span className="font-medium">Subtotal</span>
          </div>
        </div>
        <div className="border-t border-border-soft" />

        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={`${item.nftId}-${item.editionLabel}`}
              className="flex h-[70px] items-center justify-between gap-3 bg-surface-card"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt=""
                  width={70}
                  height={70}
                  className="size-[70px] shrink-0 rounded-lg object-cover"
                />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-base leading-4 font-bold break-words text-foreground">
                    {item.name}
                  </span>
                  <span className="text-sm leading-4 text-brand-secondary">
                    ID do token: #{item.tokenId}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-8 text-right sm:gap-12">
                <span className="text-sm leading-4 text-text-secondary">(x {item.quantity})</span>
                <span className="text-lg leading-4 font-bold text-text-accent">
                  {formatEth(item.lineTotalEth)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3">
          {order.discountEth !== '0' ? (
            <div className="flex justify-between gap-4 text-[15px] text-foreground">
              <dt>Desconto</dt>
              <dd>(-) {formatEth(order.discountEth)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 text-[15px] text-foreground">
            <dt>Taxa de rede</dt>
            <dd className="text-lg leading-4">
              {formatEth(order.networkFeeEth, { minFractionDigits: 3 })}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-bold text-foreground">
            <dt>Total</dt>
            <dd className="text-lg leading-4 text-text-accent">
              {formatEth(order.totalEth, { minFractionDigits: 3 })}
            </dd>
          </div>
        </dl>

        <div className="border-t border-border-soft" />

        <footer className="flex flex-col items-center gap-6 pt-1 text-center">
          <p className="max-w-[490px] text-sm leading-[22px] text-text-secondary">
            Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida
            para sua carteira conectada e registrada na rede.
          </p>
          {transaction ? (
            <a
              href={transaction.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                size: 'lg',
                className: 'h-12 rounded-[5px] px-4 text-base',
              })}
            >
              Ver no {explorer}
              <span className="sr-only">(abre em uma nova aba)</span>
            </a>
          ) : null}
        </footer>
      </section>

      <div className="h-2.5 bg-primary" />
    </article>
  )
}
