import { api } from './api'
import { removeToken, setToken } from '../lib/storage'
import type { SignInResponse, UserProfile } from '../types/api.types'

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
