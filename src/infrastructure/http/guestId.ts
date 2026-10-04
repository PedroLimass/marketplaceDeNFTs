export const GUEST_ID_STORAGE_KEY = 'kurio.guest-id'
export const GUEST_ID_HEADER = 'X-Guest-Id'

let cached: string | undefined

export function getGuestId(): string {
  if (cached) return cached

  try {
    const stored = window.localStorage.getItem(GUEST_ID_STORAGE_KEY)
    if (stored) {
      cached = stored
      return stored
    }
  } catch {}

  const created = crypto.randomUUID()
  cached = created
  try {
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, created)
  } catch {}
  return created
}

export function resetGuestIdCache(): void {
  cached = undefined
}
