import type { ApiError } from '../types/api.types'

export class ApiRequestError extends Error {
  statusCode: number
  error: string
  fields?: Record<string, string[]>

  constructor(payload: ApiError) {
    super(payload.message)
    this.name = 'ApiRequestError'
    this.statusCode = payload.statusCode
    this.error = payload.error
    this.fields = payload.fields
  }
}

export function mapFieldErrors(
  fields: Record<string, string[]> | undefined,
): Record<string, string> {
  if (!fields) return {}

  return Object.fromEntries(
    Object.entries(fields).map(([key, messages]) => [key, messages[0]]),
  )
}

export function getFieldError(
  fields: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fields?.[field]?.[0]
}

export function getUnknownFieldErrors(
  fields: Record<string, string[]> | undefined,
  knownFields: string[],
): string[] {
  if (!fields) return []

  return Object.entries(fields)
    .filter(([key]) => !knownFields.includes(key))
    .flatMap(([, messages]) => messages)
}
