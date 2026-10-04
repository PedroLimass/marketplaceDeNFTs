import { replaceEqualDeep } from '@tanstack/react-query'

type VersionedRecord = Record<string, unknown> & { id: string; version: number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isVersioned = (value: unknown): value is VersionedRecord =>
  isRecord(value) && typeof value.id === 'string' && typeof value.version === 'number'

function collect(value: unknown, into: Map<string, VersionedRecord>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collect(entry, into)
    return
  }
  if (!isRecord(value)) return

  if (isVersioned(value)) {
    const known = into.get(value.id)
    if (!known || value.version > known.version) into.set(value.id, value)
  }
  for (const entry of Object.values(value)) collect(entry, into)
}

function apply(value: unknown, known: Map<string, VersionedRecord>): unknown {
  if (Array.isArray(value)) {
    const mapped = value.map((entry: unknown) => apply(entry, known))
    return mapped.some((entry, index) => entry !== value[index]) ? mapped : value
  }
  if (!isRecord(value)) return value

  if (isVersioned(value)) {
    const current = known.get(value.id)
    if (current && current.version > value.version) return current
  }

  let changed = false
  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    const mapped = apply(entry, known)
    if (mapped !== entry) changed = true
    next[key] = mapped
  }
  return changed ? next : value
}

export function keepNewestVersion(oldData: unknown, newData: unknown): unknown {
  if (oldData === undefined) return newData

  const known = new Map<string, VersionedRecord>()
  collect(oldData, known)
  return replaceEqualDeep(oldData, apply(newData, known))
}
