import axios, { type AxiosInstance } from 'axios'

import { env } from '@/app/config/env'

import { installInterceptors } from './interceptors'

export const REQUEST_TIMEOUT_MS = 10_000

export function createHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
    // Arrays viram parâmetros repetidos (?tag=a&tag=b), em vez de tag[]=a.
    paramsSerializer: { indexes: null },
  })

  installInterceptors(client)

  return client
}

export const http = createHttpClient(env.apiBaseUrl)
