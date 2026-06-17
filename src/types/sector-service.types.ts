import type { PaginatedMeta } from './api.types'

export interface SectorServiceItem {
  id: string
  name: string
  active: boolean
  sectorId: string
  createdAt: string
  updatedAt: string
}

export interface CreateSectorServicePayload {
  name: string
  active: boolean
}

export interface UpdateSectorServicePayload {
  name?: string
  active?: boolean
}

export interface SectorServicesQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface PaginatedSectorServices {
  data: SectorServiceItem[]
  meta: PaginatedMeta
}
