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

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
