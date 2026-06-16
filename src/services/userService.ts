import { api } from './api'
import type {
  CreateUserPayload,
  PaginatedUsers,
  UpdateUserPayload,
  User,
  UsersQuery,
} from '../types/user.types'

function buildQuery(params: UsersQuery): string {
  const search = new URLSearchParams()

  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.search) search.set('search', params.search)
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getUsers(params: UsersQuery = {}): Promise<PaginatedUsers> {
  return api<PaginatedUsers>(`/users${buildQuery(params)}`)
}

export function getUser(id: string): Promise<User> {
  return api<User>(`/users/${id}`)
}

export function createUser(payload: CreateUserPayload): Promise<User> {
  return api<User>('/users', { method: 'POST', body: payload })
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return api<User>(`/users/${id}`, { method: 'PATCH', body: payload })
}

export function deactivateUser(id: string): Promise<User> {
  return api<User>(`/users/${id}`, { method: 'DELETE' })
}
