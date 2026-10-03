import { http, HttpResponse } from 'msw'

import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type SessionResponse,
} from '@/features/auth/schemas/auth.schemas'

import { getDb, mutateDb } from '../db/mockDb'
import type { SessionRecord, UserRecord } from '../db/types'
import { apiPath } from '../lib/apiPath'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { generateSalt, hashPassword, verifyPassword } from '../lib/password'
import {
  authenticate,
  createSession,
  readBearerToken,
  sessionExpiredResponse,
} from '../lib/session'
import { toUserDto } from '../lib/userDto'
import { getScenario } from '../scenarios/current'

const emailTaken = () =>
  errorResponse(409, 'email_taken', 'Já existe uma conta com este e-mail.', {
    email: ['Este e-mail já está em uso.'],
  })

const usernameTaken = () =>
  errorResponse(409, 'username_taken', 'Este nome de usuário já está em uso.', {
    username: ['Este nome de usuário já está em uso.'],
  })

function toAuthResponse(user: UserRecord, session: SessionRecord): AuthResponse {
  return {
    user: toUserDto(user),
    access_token: session.token,
    expires_at: new Date(session.expiresAt).toISOString(),
  }
}

export const authHandlers = [
  http.post(apiPath('/auth/register'), async ({ request }) => {
    const parsed = registerRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const { username, email, password } = parsed.data
    const { users } = getDb()

    if (getScenario().signup.forceConflict) return emailTaken()
    if (users.some((user) => user.email === email)) return emailTaken()
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return usernameTaken()
    }

    const passwordSalt = generateSalt()
    const user: UserRecord = {
      id: `usr_${crypto.randomUUID()}`,
      username,
      displayName: username,
      email,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
      ensName: null,
      walletNickname: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }

    mutateDb((draft) => {
      draft.users.push(user)
    })

    return HttpResponse.json(toAuthResponse(user, createSession(user.id)), { status: 201 })
  }),

  http.post(apiPath('/auth/login'), async ({ request }) => {
    const parsed = loginRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const { email, password } = parsed.data
    const user = getDb().users.find((candidate) => candidate.email === email)
    const valid = user
      ? await verifyPassword(password, user.passwordSalt, user.passwordHash)
      : false

    if (!user || !valid) {
      return errorResponse(401, 'invalid_credentials', 'E-mail ou senha incorretos.')
    }

    return HttpResponse.json(toAuthResponse(user, createSession(user.id)))
  }),

  http.get(apiPath('/auth/session'), ({ request }) => {
    const result = authenticate(request)

    if (result.authenticated) {
      const body: SessionResponse = {
        user: toUserDto(result.user),
        expires_at: new Date(result.session.expiresAt).toISOString(),
      }
      return HttpResponse.json(body)
    }

    if (result.reason === 'expired') return sessionExpiredResponse()

    const guest: SessionResponse = { user: null, expires_at: null }
    return HttpResponse.json(guest)
  }),

  http.post(apiPath('/auth/logout'), ({ request }) => {
    const token = readBearerToken(request)

    if (token) {
      mutateDb((draft) => {
        draft.sessions = draft.sessions.filter((session) => session.token !== token)
      })
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
