import { env } from '@/app/config/env'

const prefix = env.apiBaseUrl.startsWith('/') ? `*${env.apiBaseUrl}` : env.apiBaseUrl

export function apiPath(path: string): string {
  return `${prefix.replace(/\/$/, '')}${path}`
}

export function relativePath(url: string): string {
  const { pathname } = new URL(url)
  const base = env.apiBaseUrl.startsWith('/') ? env.apiBaseUrl : new URL(env.apiBaseUrl).pathname
  const trimmed = base.replace(/\/$/, '')
  return pathname.startsWith(trimmed) ? pathname.slice(trimmed.length) || '/' : pathname
}
