function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * O parâmetro `redirect` vem da URL e, portanto, de quem a montou. Só aceitamos
 * caminhos internos: nada de outro domínio, `//host` ou esquemas como `javascript:`.
 */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined
  if (hasControlCharacter(value)) return undefined

  const path = value.split(/[?#]/, 1)[0] ?? ''
  if (path === '/login' || path === '/signup') return undefined

  return value
}
