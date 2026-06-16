import { ApiRequestError } from '../lib/parseApiError'
import { getToken, removeToken } from '../lib/storage'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options

  const requestHeaders = new Headers(headers)

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getToken()
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      removeToken()
    }

    throw new ApiRequestError({
      statusCode: response.status,
      error: data?.error ?? 'Error',
      message: data?.message ?? 'Ocorreu um erro inesperado.',
      fields: data?.fields,
    })
  }

  return data as T
}

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}
