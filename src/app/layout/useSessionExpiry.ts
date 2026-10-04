import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { onSessionExpired } from '@/features/auth/session/sessionEvents'
import { toast } from '@/shared/lib/toast'

import { isPrivatePath } from '../router/guards'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.'

/**
 * Quando o servidor encerra a sessão, quem está em tela privada (perfil, pagamento, pedido)
 * é levado ao login e volta ao mesmo lugar depois; em telas públicas só recebe o aviso.
 */
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
