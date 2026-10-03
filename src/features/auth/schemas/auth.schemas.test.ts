import { describe, expect, it } from 'vitest'

import {
  authResponseSchema,
  loginRequestSchema,
  registerFormSchema,
  registerRequestSchema,
  sessionResponseSchema,
} from './auth.schemas'

describe('registerRequestSchema', () => {
  const valid = { username: 'nova.alves', email: ' Nova@Kurio.test ', password: 'Kurio@2026' }

  it('normaliza e-mail (espaços e caixa) e aceita dados válidos', () => {
    expect(registerRequestSchema.parse(valid).email).toBe('nova@kurio.test')
  })

  it.each([
    ['username', { ...valid, username: 'ab' }],
    ['username', { ...valid, username: 'nome com espaço' }],
    ['email', { ...valid, email: 'invalido' }],
    ['password', { ...valid, password: 'curta1' }],
    ['password', { ...valid, password: 'somenteletras' }],
    ['password', { ...valid, password: '12345678' }],
  ])('rejeita %s inválido', (field, input) => {
    const result = registerRequestSchema.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path[0])).toContain(field)
  })
})

describe('registerFormSchema', () => {
  const valid = {
    username: 'nova.alves',
    email: 'nova@kurio.test',
    password: 'Kurio@2026',
    confirmPassword: 'Kurio@2026',
  }

  it('aceita quando a confirmação é igual à senha', () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true)
  })

  it('aponta a divergência no campo de confirmação', () => {
    const result = registerFormSchema.safeParse({ ...valid, confirmPassword: 'Outra@2026' })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toMatchObject([
      { path: ['confirmPassword'], message: 'As senhas não coincidem.' },
    ])
  })

  it('exige a confirmação preenchida', () => {
    expect(registerFormSchema.safeParse({ ...valid, confirmPassword: '' }).success).toBe(false)
  })
})

describe('loginRequestSchema', () => {
  it('exige e-mail válido e senha preenchida', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
    expect(loginRequestSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false)
    expect(loginRequestSchema.safeParse({ email: 'nao-e-email', password: 'x' }).success).toBe(
      false,
    )
  })
})

describe('respostas da API', () => {
  const userDto = {
    id: 'usr_nova',
    username: 'nova',
    display_name: 'Nova Alves',
    email: 'nova@kurio.test',
    ens_name: 'nova',
    wallet_nickname: null,
    avatar_url: null,
  }

  it('valida a resposta de login e cadastro', () => {
    const body = { user: userDto, access_token: 'tok', expires_at: '2026-07-29T15:00:00.000Z' }

    expect(authResponseSchema.safeParse(body).success).toBe(true)
    expect(authResponseSchema.safeParse({ ...body, expires_at: 'ontem' }).success).toBe(false)
  })

  it('aceita visitante e usuário logado na consulta de sessão', () => {
    expect(sessionResponseSchema.safeParse({ user: null, expires_at: null }).success).toBe(true)
    expect(
      sessionResponseSchema.safeParse({
        user: userDto,
        expires_at: '2026-07-29T15:00:00.000Z',
      }).success,
    ).toBe(true)
  })
})
