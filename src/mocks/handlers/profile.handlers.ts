import { http, HttpResponse } from 'msw'

import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
  type ProfileDto,
} from '@/features/profile/schemas/profile.schemas'

import { getDb, mutateDb } from '../db/mockDb'
import type { UserRecord } from '../db/types'
import { apiPath } from '../lib/apiPath'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { generateSalt, hashPassword, verifyPassword } from '../lib/password'
import { requireUser } from '../lib/session'

function toProfileDto(user: UserRecord): ProfileDto {
  return {
    display_name: user.displayName,
    username: user.username,
    email: user.email,
    ens_name: user.ensName,
    wallet_nickname: user.walletNickname,
    avatar_url: user.avatarUrl,
  }
}

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

export const profileHandlers = [
  http.get(apiPath('/profile'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    return HttpResponse.json(toProfileDto(auth.user))
  }),

  http.patch(apiPath('/profile'), async ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const parsed = updateProfileRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const { display_name, username, email, ens_name, wallet_nickname } = parsed.data
    const others = getDb().users.filter((user) => user.id !== auth.user.id)

    if (others.some((user) => user.email === email)) {
      return errorResponse(409, 'email_taken', 'Já existe uma conta com este e-mail.', {
        email: ['Este e-mail já está em uso.'],
      })
    }
    if (others.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return errorResponse(409, 'username_taken', 'Este nome de usuário já está em uso.', {
        username: ['Este nome de usuário já está em uso.'],
      })
    }

    const updated = mutateDb((db) => {
      const user = db.users.find((candidate) => candidate.id === auth.user.id)
      if (!user) return undefined

      user.displayName = display_name
      user.username = username
      user.email = email
      user.ensName = ens_name
      user.walletNickname = wallet_nickname
      return user
    })

    return updated
      ? HttpResponse.json(toProfileDto(updated))
      : errorResponse(404, 'user_not_found', 'Usuário não encontrado.')
  }),

  http.put(apiPath('/profile/avatar'), async ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const form = await request.formData().catch(() => undefined)
    const file = form?.get('avatar')

    if (!(file instanceof File)) {
      return errorResponse(422, 'validation_failed', 'Envie uma imagem.', {
        avatar: ['Selecione uma imagem.'],
      })
    }
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      return errorResponse(415, 'unsupported_media_type', 'Formato de imagem não aceito.', {
        avatar: ['Use uma imagem JPG, PNG ou WebP.'],
      })
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return errorResponse(413, 'payload_too_large', 'A imagem é grande demais.', {
        avatar: ['A imagem deve ter no máximo 2 MB.'],
      })
    }

    const avatarUrl = await toDataUrl(file)
    mutateDb((db) => {
      const user = db.users.find((candidate) => candidate.id === auth.user.id)
      if (user) user.avatarUrl = avatarUrl
    })

    return HttpResponse.json({ avatar_url: avatarUrl })
  }),

  http.delete(apiPath('/profile/avatar'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    mutateDb((db) => {
      const user = db.users.find((candidate) => candidate.id === auth.user.id)
      if (user) user.avatarUrl = null
    })

    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiPath('/profile/password'), async ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const parsed = changePasswordRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const { current_password, new_password } = parsed.data
    const valid = await verifyPassword(
      current_password,
      auth.user.passwordSalt,
      auth.user.passwordHash,
    )
    if (!valid) {
      return errorResponse(422, 'invalid_current_password', 'A senha atual está incorreta.', {
        current_password: ['A senha atual está incorreta.'],
      })
    }

    const passwordSalt = generateSalt()
    const passwordHash = await hashPassword(new_password, passwordSalt)
    mutateDb((db) => {
      const user = db.users.find((candidate) => candidate.id === auth.user.id)
      if (user) {
        user.passwordSalt = passwordSalt
        user.passwordHash = passwordHash
      }
    })

    return new HttpResponse(null, { status: 204 })
  }),
]
