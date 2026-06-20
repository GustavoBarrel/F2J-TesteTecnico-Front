import { api } from './api'
import type { Role } from '../types/role.types'

export function getRoles(): Promise<Role[]> {
  return api<Role[]>('/admin/roles')
}

export function getRole(id: string): Promise<Role> {
  return api<Role>(`/admin/roles/${id}`)
}
