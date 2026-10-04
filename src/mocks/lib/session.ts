import { getDb, mutateDb } from '../db/mockDb'
import type { SessionRecord, UserRecord } from '../db/types'
import { getScenario } from '../scenarios/current'
import { errorResponse } from './errors'

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  const match = header ? /^Bearer (.+)$/.exec(header) : null
  return match?.[1] ?? null
}

export function createSession(userId: string, now = Date.now()): SessionRecord {
  const session: SessionRecord = {
    token: `tok_${crypto.randomUUID()}`,
    userId,
    expiresAt: now + getScenario().session.ttlMs,
  }

  mutateDb((db) => {
    db.sessions.push(session)
  })

  return session
}

export type Authentication =
  | { authenticated: true; user: UserRecord; session: SessionRecord }
  | { authenticated: false; reason: 'guest' | 'expired' }

export function authenticate(request: Request, now = Date.now()): Authentication {
  const token = readBearerToken(request)
  if (!token) return { authenticated: false, reason: 'guest' }

  const db = getDb()
  const session = db.sessions.find((candidate) => candidate.token === token)
  const user = session && db.users.find((candidate) => candidate.id === session.userId)

  if (!session || !user || session.expiresAt <= now) {
    return { authenticated: false, reason: 'expired' }
  }

  return { authenticated: true, user, session }
}

export const sessionExpiredResponse = () =>
  errorResponse(401, 'session_expired', 'Sua sessão expirou. Entre novamente.')

export const unauthenticatedResponse = () =>
  errorResponse(401, 'unauthenticated', 'Entre na sua conta para continuar.')

export function requireUser(
  request: Request,
): { user: UserRecord; session: SessionRecord } | { response: Response } {
  const result = authenticate(request)

  if (result.authenticated) return { user: result.user, session: result.session }

  return {
    response: result.reason === 'expired' ? sessionExpiredResponse() : unauthenticatedResponse(),
  }
}
