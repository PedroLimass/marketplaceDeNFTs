import { queryOptions } from '@tanstack/react-query'

import { isApiError } from '@/infrastructure/http/errors'
import { SESSION_EXPIRED_CODE } from '@/infrastructure/http/interceptors'

import { tokenStorage } from '../storage/tokenStorage'
import { fetchSession } from './authApi'
import { authKeys } from './authKeys'

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: async ({ signal }) => {
    if (!tokenStorage.get()) return null

    try {
      return await fetchSession(signal)
    } catch (error) {
      if (isApiError(error) && error.code === SESSION_EXPIRED_CODE) {
        tokenStorage.clear()
        return null
      }
      throw error
    }
  },
})
