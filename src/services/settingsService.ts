import { api } from './api'
import type {
  RequestAutoCompleteSettings,
  RequestAutoCompleteSettingsOptions,
  UpdateRequestAutoCompleteSettingsPayload,
} from '../types/settings.types'

export function getRequestAutoCompleteSettings(): Promise<RequestAutoCompleteSettings> {
  return api<RequestAutoCompleteSettings>('/admin/settings/request-auto-complete')
}

export function getRequestAutoCompleteOptions(): Promise<RequestAutoCompleteSettingsOptions> {
  return api<RequestAutoCompleteSettingsOptions>(
    '/admin/settings/request-auto-complete/options',
  )
}

export function updateRequestAutoCompleteSettings(
  payload: UpdateRequestAutoCompleteSettingsPayload,
): Promise<RequestAutoCompleteSettings> {
  return api<RequestAutoCompleteSettings>('/admin/settings/request-auto-complete', {
    method: 'PATCH',
    body: payload,
  })
}
