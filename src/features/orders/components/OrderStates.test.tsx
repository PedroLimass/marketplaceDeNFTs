import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'

import type { Order } from '../types/order'
import { OrderLoadError, OrderPending, OrderRejected, OrderSkeleton } from './OrderStates'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
    }: {
      to: string
      children: ReactNode
      className?: string
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  }
})

const order = {
  id: 'ord_1',
  wallet: { label: 'Principal' },
  rejection: { code: 'payment_declined', message: 'A carteira recusou.' },
} as Order

describe('OrderStates', () => {
  it('mostra o esqueleto de carregamento', () => {
    render(<OrderSkeleton />)
    expect(screen.getByRole('status', { name: 'Carregando pedido' })).toBeInTheDocument()
  })

  it('explica o pedido pendente com a carteira escolhida', () => {
    render(<OrderPending order={order} />)
    expect(screen.getByRole('heading', { name: 'Aguardando a confirmação na rede' })).toBeVisible()
    expect(screen.getByText(/carteira Principal/)).toBeVisible()
  })

  it('mostra a recusa da API ou o texto padrão', () => {
    const { rerender } = render(<OrderRejected order={order} />)
    expect(screen.getByRole('alert')).toHaveTextContent('A carteira recusou.')

    rerender(<OrderRejected order={{ ...order, rejection: null }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('O pedido foi recusado.')
    expect(screen.getByRole('link', { name: 'Tentar novamente' })).toHaveAttribute(
      'href',
      '/checkout',
    )
  })

  it('distingue pedido inexistente de falha de carga', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <OrderLoadError
        error={new ApiError({ kind: 'not_found', message: 'sumiu' })}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')

    rerender(
      <OrderLoadError
        error={new ApiError({ kind: 'timeout', message: 'lento' })}
        onRetry={onRetry}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar o pedido' }),
    ).toBeVisible()
    expect(screen.getByText('lento')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalled()

    rerender(<OrderLoadError error={new Error('x')} onRetry={onRetry} />)
    expect(screen.getByText('Tente novamente em instantes.')).toBeVisible()
  })
})
