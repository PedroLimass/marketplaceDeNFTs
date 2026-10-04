import { Link } from '@tanstack/react-router'
import { ExternalLink, PartyPopper, X } from 'lucide-react'

import { networkLabels } from '@/features/catalog/constants'
import { shortenAddress } from '@/shared/lib/address'
import { formatEth } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'

import type { Order } from '../types/order'
import { explorerNames, formatReceiptDate } from '../utils/format'

function Meta({ label, children, title }: { label: string; children: string; title?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-4 first:pl-0 last:pr-0">
      <dt className="text-xs leading-4 text-text-secondary">{label}</dt>
      <dd title={title} className="truncate text-sm leading-4 font-bold text-text-primary">
        {children}
      </dd>
    </div>
  )
}

/** Recibo da compra confirmada: dados da transação, itens comprados e totais. */
export function OrderReceipt({ order }: { order: Order }) {
  const { transaction } = order
  const explorer = explorerNames[order.network]

  return (
    <article
      aria-labelledby="recibo-titulo"
      className="relative mx-auto flex w-full max-w-[578px] flex-col gap-7 rounded-2xl border border-border bg-surface-card p-5 sm:p-8"
    >
      <Link
        to="/"
        aria-label="Fechar recibo e voltar ao início"
        className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-surface-raised hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X aria-hidden="true" className="size-5" />
      </Link>

      <header className="flex flex-col items-center gap-4 pt-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper aria-hidden="true" className="size-10" />
        </span>
        <h1 id="recibo-titulo" className="text-lg leading-6 font-bold text-text-primary">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <dl className="grid grid-cols-2 gap-x-0 gap-y-4 rounded-lg bg-surface-dark px-4 py-4 sm:grid-cols-4 sm:divide-x sm:divide-border-soft">
        <Meta label="ID da transação" title={transaction?.hash ?? ''}>
          {transaction ? shortenAddress(transaction.hash) : '—'}
        </Meta>
        <Meta label="Data">{formatReceiptDate(order.resolvedAt ?? order.createdAt)}</Meta>
        <Meta label="Total">{formatEth(order.totalEth, { minFractionDigits: 3 })}</Meta>
        <Meta label="Carteira">{order.wallet.label}</Meta>
      </dl>

      <section aria-labelledby="detalhes-titulo" className="flex flex-col gap-4">
        <h2
          id="detalhes-titulo"
          className="border-b border-border-soft pb-3 text-[15px] leading-4 font-bold text-text-primary"
        >
          Detalhes da transação
        </h2>

        <table className="w-full border-separate border-spacing-0 text-left">
          <caption className="sr-only">NFTs comprados</caption>
          <thead>
            <tr className="text-xs leading-4 text-text-secondary">
              <th scope="col" className="pb-3 font-normal">
                NFTs
              </th>
              <th scope="col" className="px-3 pb-3 font-normal">
                Edições
              </th>
              <th scope="col" className="pb-3 text-right font-normal">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.nftId}-${item.editionLabel}`} className="align-middle">
                <td className="py-2 pr-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={70}
                      height={70}
                      className="size-12 shrink-0 rounded-lg object-cover sm:size-[70px]"
                    />
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-sm leading-4 font-bold break-words text-text-primary">
                        {item.name}
                      </span>
                      <span className="text-xs leading-4 text-text-secondary">
                        ID do token: #{item.tokenId}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap text-text-primary">
                  (x {item.quantity})
                </td>
                <td className="py-2 text-right text-sm whitespace-nowrap text-text-primary">
                  {formatEth(item.lineTotalEth)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="flex flex-col gap-3 border-t border-border-soft pt-4">
          {order.discountEth !== '0' ? (
            <div className="flex justify-between gap-4 text-sm text-text-primary">
              <dt>Desconto</dt>
              <dd>(-) {formatEth(order.discountEth)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 text-sm text-text-primary">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(order.networkFeeEth, { minFractionDigits: 3 })}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-bold text-text-primary">
            <dt>Total</dt>
            <dd className="text-text-accent">
              {formatEth(order.totalEth, { minFractionDigits: 3 })}
            </dd>
          </div>
        </dl>
      </section>

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-5 text-text-secondary">
          Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para
          a sua carteira conectada.
        </p>
        {transaction ? (
          <a
            href={transaction.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: 'lg', className: 'shrink-0' })}
          >
            Ver no {explorer}
            <ExternalLink aria-hidden="true" />
            <span className="sr-only">(abre em uma nova aba)</span>
          </a>
        ) : null}
      </footer>
    </article>
  )
}
