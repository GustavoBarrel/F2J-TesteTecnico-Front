import type { PaginatedMeta } from './api.types'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  isGlobalAdmin: boolean
  isActive: boolean
  createdAt: string
}

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  username?: string
  password: string
  isGlobalAdmin?: boolean
  isActive?: boolean
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  email?: string
  username?: string
  password?: string
  isGlobalAdmin?: boolean
  isActive?: boolean
}

export interface UsersQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface PaginatedUsers {
  data: User[]
  meta: PaginatedMeta
}
