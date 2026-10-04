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
