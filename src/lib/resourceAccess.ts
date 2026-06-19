import { isApiError } from '../services/api'
import type { ApiRequestError } from './parseApiError'

const ACCESS_DENIED_STATUS_CODES = new Set([401, 403, 404])

export function isAccessDeniedError(error: unknown): error is ApiRequestError {
  return isApiError(error) && ACCESS_DENIED_STATUS_CODES.has(error.statusCode)
}

export function getAccessDeniedRedirect(statusCode: number): string {
  return statusCode === 401 ? '/login' : '/'
}

/**
 * Carrega o recurso principal (controle de acesso) antes dos dados secundários.
 * Evita que erros de endpoints auxiliares mascarem a mensagem de autorização.
 */
export async function loadGatedResource<TPrimary>(
  loadPrimary: () => Promise<TPrimary>,
  loadSecondary?: (primary: TPrimary) => Promise<void>,
): Promise<TPrimary> {
  const primary = await loadPrimary()
  if (loadSecondary) {
    await loadSecondary(primary)
  }
  return primary
}
