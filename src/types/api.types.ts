export interface ApiError {
  statusCode: number
  error: string
  message: string
  fields?: Record<string, string[]>
}

export interface UserProfile {
  sub: string
  email: string
  username: string
  isGlobalAdmin: boolean
  iat?: number
  exp?: number
}

export interface SignInResponse {
  access_token: string
}

export interface PasswordResetRequestPayload {
  username?: string
  email?: string
}

export interface PasswordResetRequestResponse {
  sent: boolean
  message: string
}

export interface PasswordResetConfirmPayload {
  username?: string
  email?: string
  code: string
  password: string
  passwordConfirmation: string
}

export interface PasswordResetConfirmResponse {
  message: string
}

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
