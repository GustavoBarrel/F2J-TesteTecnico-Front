import { api } from './api'
import { removeToken, setToken } from '../lib/storage'
import type {
  PasswordResetConfirmPayload,
  PasswordResetConfirmResponse,
  PasswordResetRequestPayload,
  PasswordResetRequestResponse,
  SignInResponse,
  UserProfile,
} from '../types/api.types'

export async function login(username: string, password: string): Promise<UserProfile> {
  const { access_token } = await api<SignInResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  })

  setToken(access_token)
  return getProfile()
}

export function getProfile(): Promise<UserProfile> {
  return api<UserProfile>('/auth/profile')
}

export function logout(): void {
  removeToken()
}

export function requestPasswordReset(
  payload: PasswordResetRequestPayload,
): Promise<PasswordResetRequestResponse> {
  return api<PasswordResetRequestResponse>('/auth/request-password-reset', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function resetPassword(
  payload: PasswordResetConfirmPayload,
): Promise<PasswordResetConfirmResponse> {
  return api<PasswordResetConfirmResponse>('/auth/reset-password', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}
