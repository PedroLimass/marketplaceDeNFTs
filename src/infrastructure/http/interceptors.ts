import { isCancel, type AxiosInstance } from 'axios'

import { toApiError, type ApiError } from './errors'
import { getGuestId, GUEST_ID_HEADER } from './guestId'

export const SESSION_EXPIRED_CODE = 'session_expired'

export interface HttpHooks {
  getAccessToken: () => string | null
  onSessionExpired: (error: ApiError) => void
}

const defaultHooks: HttpHooks = {
  getAccessToken: () => null,
  onSessionExpired: () => undefined,
}

let hooks: HttpHooks = defaultHooks

export function configureHttp(next: Partial<HttpHooks>): void {
  hooks = { ...hooks, ...next }
}

export function resetHttpHooks(): void {
  hooks = defaultHooks
}

export function installInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    const token = hooks.getAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    if (!config.headers.has(GUEST_ID_HEADER)) {
      config.headers.set(GUEST_ID_HEADER, getGuestId())
    }
    return config
  })

  client.interceptors.response.use(undefined, (error: unknown) => {
    // Cancelamentos são intencionais e o TanStack Query os trata sozinho.
    if (isCancel(error)) {
      return Promise.reject(error)
    }

    const apiError = toApiError(error)

    if (apiError.kind === 'unauthorized' && apiError.code === SESSION_EXPIRED_CODE) {
      hooks.onSessionExpired(apiError)
    }

    return Promise.reject(apiError)
  })
}
