import type { PaginatedMeta } from './api.types'

export type RequestStatus =
  | 'NEW'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface RequestUserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface RequestPermissions {
  canView: boolean
  canEdit: boolean
  canArchive: boolean
}

export interface Request {
  id: string
  title: string
  description: string
  status: RequestStatus
  priority: RequestPriority
  sectorId: string
  sectorServiceId: string
  createdById: string
  assignees: RequestUserSummary[]
  observers: RequestUserSummary[]
  createdAt: string
  updatedAt: string
  permissions: RequestPermissions
}

export interface CreateRequestPayload {
  title: string
  description: string
  sectorServiceId: string
}

export interface UpdateRequestPayload {
  title?: string
  description?: string
  priority?: RequestPriority
}

export interface ChangeStatusPayload {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface RequestMessage {
  id: string
  content: string
  authorId: string
  author?: RequestUserSummary
  createdAt: string
}

export interface RequestHistoryEntry {
  id: string
  event: string
  description?: string
  userId?: string
  user?: RequestUserSummary
  createdAt: string
}

export interface RequestsQuery {
  page?: number
  limit?: number
  sectorId?: string
  status?: RequestStatus
}

export interface SectorRequestsQuery {
  page?: number
  limit?: number
  status?: RequestStatus
  priority?: RequestPriority
  search?: string
  scope?: 'queue'
}

export interface PaginatedRequests {
  data: Request[]
  meta: PaginatedMeta
}

export interface MeSector {
  id: string
  name: string
  role: 'MANAGER' | 'TECHNICIAN' | null
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
  statusCounts: Array<{ status: RequestStatus; count: number }>
}

export interface SectorServiceOption {
  id: string
  name: string
  isActive: boolean
  sectorId: string
}

export interface SectorWithServicesOption {
  id: string
  name: string
  sectorServices: SectorServiceOption[]
}

export interface SectorMemberOption {
  id: string
  firstName: string
  lastName: string
  email: string
  role?: string
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: 'Nova',
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  ARCHIVED: 'Arquivada',
}

export const REQUEST_PRIORITY_LABEL: Record<RequestPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}
