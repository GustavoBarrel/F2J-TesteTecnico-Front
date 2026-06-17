import { api } from './api'
import type {
  CreateSectorServicePayload,
  PaginatedSectorServices,
  SectorServiceItem,
  SectorServicesQuery,
  UpdateSectorServicePayload,
} from '../types/sector-service.types'

function buildQuery(params: SectorServicesQuery): string {
  const search = new URLSearchParams()

  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.search) search.set('search', params.search)
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getSectorServices(
  sectorId: string,
  params: SectorServicesQuery = {},
): Promise<PaginatedSectorServices> {
  return api<PaginatedSectorServices>(`/sectors/${sectorId}/services${buildQuery(params)}`)
}

export function getSectorService(sectorId: string, id: string): Promise<SectorServiceItem> {
  return api<SectorServiceItem>(`/sectors/${sectorId}/services/${id}`)
}

export function createSectorService(
  sectorId: string,
  payload: CreateSectorServicePayload,
): Promise<SectorServiceItem> {
  return api<SectorServiceItem>(`/sectors/${sectorId}/services`, {
    method: 'POST',
    body: payload,
  })
}

export function updateSectorService(
  sectorId: string,
  id: string,
  payload: UpdateSectorServicePayload,
): Promise<SectorServiceItem> {
  return api<SectorServiceItem>(`/sectors/${sectorId}/services/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function toggleSectorServiceActive(
  sectorId: string,
  id: string,
): Promise<SectorServiceItem> {
  return api<SectorServiceItem>(`/sectors/${sectorId}/services/${id}/toggle-active`, {
    method: 'PATCH',
  })
}
