import { http } from '@/infrastructure/http/axios'

import { mapAuthResponse, mapSessionResponse } from '../mappers/mapAuth'
import {
  authResponseSchema,
  sessionResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from '../schemas/auth.schemas'
import type { AuthResult, Session } from '../types/auth'

export async function login(input: LoginRequest): Promise<AuthResult> {
  const { data } = await http.post<unknown>('/auth/login', input)
  return mapAuthResponse(authResponseSchema.parse(data))
}

export async function register(input: RegisterRequest): Promise<AuthResult> {
  const { data } = await http.post<unknown>('/auth/register', input)
  return mapAuthResponse(authResponseSchema.parse(data))
}

export async function fetchSession(signal: AbortSignal): Promise<Session | null> {
  const { data } = await http.get<unknown>('/auth/session', { signal })
  return mapSessionResponse(sessionResponseSchema.parse(data))
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}
