import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'

import { NftLoadError } from './NftDetailStates'

describe('NftLoadError', () => {
  it('explica erro de rede e permite tentar de novo', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <NftLoadError
        error={new ApiError({ kind: 'network', message: 'Não foi possível conectar ao servidor.' })}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Sem conexão' })).toBeVisible()
    expect(screen.getByText('Não foi possível conectar ao servidor.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('explica erro inesperado sem ApiError', () => {
    render(<NftLoadError error={new Error('x')} onRetry={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Não foi possível carregar o NFT' })).toBeVisible()
    expect(screen.getByText('Ocorreu um erro inesperado. Tente novamente.')).toBeVisible()
  })
})
