import { Link } from '@tanstack/react-router'

import { formatEth } from '@/shared/lib/money'

import type { CartItem } from '../types/cart'
import { CartItemControls } from './CartItemControls'

function Thumb({ item, className }: { item: CartItem; className: string }) {
  return (
    <img
      src={item.nft.thumbnailUrl}
      alt=""
      width={100}
      height={100}
      className={`${className} shrink-0 rounded-lg object-cover`}
    />
  )
}

function ItemName({ item }: { item: CartItem }) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: item.nft.id }}
      className="rounded-sm text-base leading-4 font-medium text-text-primary outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
    >
      {item.nft.name}
    </Link>
  )
}

export function CartTable({ items }: { items: CartItem[] }) {
  return (
    <table className="w-full border-separate border-spacing-0 text-left">
      <caption className="sr-only">NFTs no carrinho</caption>
      <thead>
        <tr className="text-sm leading-4 text-text-secondary">
          <th scope="col" className="border-b border-border-soft pr-4 pb-3 font-normal">
            NFTs
          </th>
          <th scope="col" className="border-b border-border-soft px-4 pb-3 font-normal">
            Preço
          </th>
          <th scope="col" className="border-b border-border-soft px-4 pb-3 font-normal">
            Quantidade
          </th>
          <th scope="col" className="border-b border-border-soft pb-3 pl-4 text-right font-normal">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="text-sm text-text-primary">
            <td className="py-3 pr-4">
              <div className="flex items-center gap-4">
                <Thumb item={item} className="size-[70px]" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <ItemName item={item} />
                  <span className="text-xs leading-4 text-text-secondary">
                    ID do token: #{item.nft.tokenId} · Edição: {item.edition.label}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">{formatEth(item.unitPriceEth)}</td>
            <td className="px-4 py-3">
              <CartItemControls item={item} />
            </td>
            <td className="py-3 pl-4 text-right font-bold whitespace-nowrap text-text-accent">
              {formatEth(item.lineTotalEth)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function CartCards({ items }: { items: CartItem[] }) {
  return (
    <ul className="flex flex-col gap-5">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 overflow-hidden rounded-xl bg-surface-card">
          <Thumb item={item} className="size-[100px] rounded-none" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-3">
            <ItemName item={item} />
            <p className="text-xs leading-4 text-text-secondary">Edição: {item.edition.label}</p>
            <p className="text-sm font-bold text-text-accent">
              <span className="sr-only">Total da linha: </span>
              {formatEth(item.lineTotalEth)}
            </p>
            <CartItemControls item={item} />
          </div>
        </li>
      ))}
    </ul>
  )
}
