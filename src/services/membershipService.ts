import { api } from './api'
import type {
  CreateMembershipPayload,
  MembershipsQuery,
  PaginatedMemberships,
  SectorMembership,
  UpdateMembershipPayload,
} from '../types/membership.types'

function buildQuery(params: MembershipsQuery): string {
  const search = new URLSearchParams()

  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.search) search.set('search', params.search)
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive))

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getMemberships(
  sectorId: string,
  params: MembershipsQuery = {},
): Promise<PaginatedMemberships> {
  return api<PaginatedMemberships>(`/admin/sectors/${sectorId}/members${buildQuery(params)}`)
}

export function getMembership(
  sectorId: string,
  id: string,
): Promise<SectorMembership> {
  return api<SectorMembership>(`/admin/sectors/${sectorId}/members/${id}`)
}

export function createMembership(
  sectorId: string,
  payload: CreateMembershipPayload,
): Promise<SectorMembership> {
  return api<SectorMembership>(`/admin/sectors/${sectorId}/members`, {
    method: 'POST',
    body: payload,
  })
}

export function updateMembership(
  sectorId: string,
  id: string,
  payload: UpdateMembershipPayload,
): Promise<SectorMembership> {
  return api<SectorMembership>(`/admin/sectors/${sectorId}/members/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function removeMembership(sectorId: string, id: string): Promise<void> {
  return api<void>(`/admin/sectors/${sectorId}/members/${id}`, { method: 'DELETE' })
}
