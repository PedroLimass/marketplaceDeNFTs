import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PasswordInput } from './password-input'

describe('PasswordInput', () => {
  it('alterna entre ocultar e mostrar a senha', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Senha" defaultValue="segredo" />)

    const field = screen.getByLabelText('Senha')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(field).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(field).toHaveAttribute('type', 'password')
  })
})
