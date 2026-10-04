import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { onSessionExpired } from '@/features/auth/session/sessionEvents'
import { toast } from '@/shared/lib/toast'

import { isPrivatePath } from '../router/guards'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.'

export function useSessionExpiry(): void {
  const router = useRouter()
  const navigate = useNavigate()

  useEffect(
    () =>
      onSessionExpired(() => {
        toast.error(SESSION_EXPIRED_MESSAGE)
        const { pathname, href } = router.state.location
        if (isPrivatePath(pathname)) {
          void navigate({ to: '/login', search: { redirect: href } })
        }
      }),
    [router, navigate],
  )
}
