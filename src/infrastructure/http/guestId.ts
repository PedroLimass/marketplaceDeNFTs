export const GUEST_ID_STORAGE_KEY = 'kurio.guest-id'
export const GUEST_ID_HEADER = 'X-Guest-Id'

let cached: string | undefined

/**
 * Identifica o visitante para que o carrinho dele sobreviva ao refresh. É gerado no
 * cliente e só serve para isso: quem tem sessão é identificado pelo token.
 */
export function getGuestId(): string {
  if (cached) return cached

  try {
    const stored = window.localStorage.getItem(GUEST_ID_STORAGE_KEY)
    if (stored) {
      cached = stored
      return stored
    }
  } catch {
    // Armazenamento bloqueado: o id vale até recarregar a página.
  }

  const created = crypto.randomUUID()
  cached = created
  try {
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, created)
  } catch {
    // Mesmo caso acima.
  }
  return created
}

export function resetGuestIdCache(): void {
  cached = undefined
}
