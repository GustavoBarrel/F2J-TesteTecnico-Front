import type { PaginatedMeta } from './api.types'
import type { PaginatedUsers, UsersQuery } from './user.types'

export interface Sector {
  id: string
  name: string
  isActive: boolean
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSectorPayload {
  name: string
  isActive: boolean
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
}

export interface UpdateSectorPayload {
  name?: string
  isActive?: boolean
  onlyManagerCanView?: boolean
  onlyManagerCanEdit?: boolean
  onlyManagerCanArchive?: boolean
}

export interface SectorsQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface PaginatedSectors {
  data: Sector[]
  meta: PaginatedMeta
}

export type AvailableUsersQuery = UsersQuery

export type PaginatedAvailableUsers = PaginatedUsers
