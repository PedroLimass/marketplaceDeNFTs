import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { NewsletterForm } from './NewsletterForm'

describe('NewsletterForm', () => {
  it('confirma a inscrição e limpa o campo', async () => {
    const user = userEvent.setup()
    render(<NewsletterForm />)

    await user.type(screen.getByLabelText('E-mail para receber lançamentos'), ' ana@kurio.test ')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('ana@kurio.test')
    expect(screen.getByLabelText('E-mail para receber lançamentos')).toHaveValue('')
  })

  it('avisa quando o e-mail é inválido e some ao corrigir', async () => {
    const user = userEvent.setup()
    render(<NewsletterForm />)
    const field = screen.getByLabelText('E-mail para receber lançamentos')

    await user.type(field, 'isso-nao-e-email')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('e-mail válido')
    expect(field).toHaveAttribute('aria-invalid', 'true')

    await user.type(field, '@kurio.test')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('não aceita envio com o campo vazio', async () => {
    const user = userEvent.setup()
    render(<NewsletterForm />)

    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
