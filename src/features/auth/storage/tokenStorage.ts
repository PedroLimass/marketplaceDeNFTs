export const TOKEN_STORAGE_KEY = 'kurio.session'

/**
 * Guarda apenas o token opaco. O usuário vem sempre de `GET /auth/session`,
 * para que nome, avatar e carteira nunca fiquem desatualizados no navegador.
 *
 * Limitação conhecida: um Service Worker não consegue definir cookie HttpOnly,
 * então o token fica em localStorage. Com um backend real, o correto é cookie
 * HttpOnly + SameSite (ver ARCHITECTURE.md).
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } catch {
      // Armazenamento bloqueado (modo privado restrito): a sessão vale só até recarregar.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    } catch {
      // Nada a limpar.
    }
  },
}
