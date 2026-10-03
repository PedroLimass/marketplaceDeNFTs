import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderAppAt } from '@/test/renderApp'

import { App } from './App'
import { AppProviders } from './providers/AppProviders'

describe('App', () => {
  it('monta o roteador com os provedores e mostra o Início', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('mostra uma página própria para rotas inexistentes', async () => {
    await renderAppAt('/nao-existe')

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})
