import { useNavigate, useRouter } from '@tanstack/react-router'

import { AuthDialog, type AuthMode } from '@/features/auth/components/AuthDialog'
import { HomePage } from '@/features/catalog/pages/HomePage'

export function AuthRoute({ mode, redirect }: { mode: AuthMode; redirect: string | undefined }) {
  const navigate = useNavigate()
  const router = useRouter()

  return (
    <>
      <HomePage />
      <AuthDialog
        mode={mode}
        redirect={redirect}
        onClose={() => {
          void navigate({ to: '/' })
        }}
        onAuthenticated={() => {
          router.history.push(redirect ?? '/')
        }}
      />
    </>
  )
}
