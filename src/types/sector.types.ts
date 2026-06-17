import type { PaginatedMeta } from './api.types'

export interface Sector {
  id: string
  name: string
  active: boolean
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSectorPayload {
  name: string
  active: boolean
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
}

export interface UpdateSectorPayload {
  name?: string
  active?: boolean
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
