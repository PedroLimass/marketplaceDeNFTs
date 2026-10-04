import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { NftGallery } from './NftGallery'

const images = [
  { url: '/one.webp', alt: 'Frente' },
  { url: '/two.webp', alt: 'Verso' },
]

describe('NftGallery', () => {
  it('não renderiza nada sem imagens', () => {
    const { container } = render(<NftGallery images={[]} name="Vazio" navigation="rail" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('troca a imagem pelos pontos do mobile e abre o zoom', async () => {
    const user = userEvent.setup()
    render(<NftGallery images={images} name="Emerald Ape #042" navigation="dots" />)

    expect(screen.getByRole('img', { name: 'Frente' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Ver imagem 2 de 2' }))
    expect(screen.getByRole('img', { name: 'Verso' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Ampliar imagem de Emerald Ape #042' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar imagem ampliada' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('troca a imagem pelas miniaturas do desktop', async () => {
    const user = userEvent.setup()
    render(<NftGallery images={images} name="Emerald Ape #042" navigation="rail" />)

    await user.click(screen.getByRole('button', { name: 'Ver imagem 2 de 2' }))
    expect(screen.getByRole('img', { name: 'Verso' })).toBeVisible()
  })
})
