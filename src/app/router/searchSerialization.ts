/**
 * Serialização da query string do roteador.
 *
 * O padrão do TanStack Router tenta `JSON.parse` em cada valor, o que transforma `min=1.50`
 * no número `1.5` (perde a formatação de um valor em ETH) e `q=42` em número. Aqui os valores
 * ficam sempre como texto e uma chave repetida vira lista (`category=a&category=b`), o mesmo
 * formato usado pela API. A validação de cada rota converte para o tipo certo.
 */
export type RawSearch = Record<string, string | string[]>

export function parseSearch(search: string): RawSearch {
  const result: RawSearch = {}
  const params = new URLSearchParams(search)

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length === 1 ? (values[0] ?? '') : values
  }

  return result
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(search)) {
    const values: unknown[] = Array.isArray(value) ? (value as unknown[]) : [value]

    for (const item of values) {
      if (item === undefined || item === null || item === '') continue
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        params.append(key, String(item))
      }
    }
  }

  const text = params.toString()
  return text ? `?${text}` : ''
}
