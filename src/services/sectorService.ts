import { api } from './api'
import type {
  CreateSectorPayload,
  PaginatedSectors,
  Sector,
  SectorsQuery,
  UpdateSectorPayload,
} from '../types/sector.types'

function buildQuery(params: SectorsQuery): string {
  const search = new URLSearchParams()

  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.search) search.set('search', params.search)
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getSectors(params: SectorsQuery = {}): Promise<PaginatedSectors> {
  return api<PaginatedSectors>(`/sectors${buildQuery(params)}`)
}

export function getSector(id: string): Promise<Sector> {
  return api<Sector>(`/sectors/${id}`)
}

export function createSector(payload: CreateSectorPayload): Promise<Sector> {
  return api<Sector>('/sectors', { method: 'POST', body: payload })
}

export function updateSector(id: string, payload: UpdateSectorPayload): Promise<Sector> {
  return api<Sector>(`/sectors/${id}`, { method: 'PATCH', body: payload })
}

export function toggleSectorActive(id: string): Promise<Sector> {
  return api<Sector>(`/sectors/${id}/toggle-active`, { method: 'PATCH' })
}
