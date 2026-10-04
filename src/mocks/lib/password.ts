const ITERATIONS = 100_000
const HASH_BITS = 256

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)))
}

export function deterministicSalt(seed: string): string {
  return toBase64(new TextEncoder().encode(`kurio:${seed}`))
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations: ITERATIONS },
    key,
    HASH_BITS,
  )
  return toBase64(new Uint8Array(bits))
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  return (await hashPassword(password, salt)) === expectedHash
}
