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
  canManageObservers: boolean
}

export type RequestParticipationRole = 'CREATOR' | 'OBSERVER'

export const REQUEST_PARTICIPATION_LABEL: Record<RequestParticipationRole, string> = {
  CREATOR: 'Criador',
  OBSERVER: 'Observador',
}

export function getRequestParticipationRoles(
  request: Pick<Request, 'createdById' | 'observers'>,
  userId: string,
): RequestParticipationRole[] {
  const roles: RequestParticipationRole[] = []
  if (request.createdById === userId) roles.push('CREATOR')
  if (request.observers.some((o) => o.id === userId)) roles.push('OBSERVER')
  return roles
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
  observerIds?: string[]
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
  author: RequestUserSummary
  createdAt: string
}

export type RequestHistoryAction =
  | 'CREATED'
  | 'UPDATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'MESSAGE_SENT'
  | 'CANCELLED'
  | 'ARCHIVED'

export interface RequestHistoryEntry {
  id: string
  action: RequestHistoryAction
  fromStatus: RequestStatus | null
  toStatus: RequestStatus | null
  metadata: Record<string, unknown> | null
  description: string | null
  createdAt: string
  user: RequestUserSummary
}

export interface RequestSectorSummary {
  id: string
  name: string
  onlyManagerCanView: boolean
  onlyManagerCanEdit: boolean
  onlyManagerCanArchive: boolean
}

export interface RequestServiceSummary {
  id: string
  name: string
}

export interface RequestDetail extends Request {
  sector: RequestSectorSummary
  sectorService: RequestServiceSummary
  createdBy: RequestUserSummary
  messages: RequestMessage[]
  history: RequestHistoryEntry[]
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

export interface AssignPayload {
  userIds: string[]
}

export interface SectorMemberOption {
  id: string
  firstName: string
  lastName: string
  email: string
  role: {
    id: string
    name: string
    slug: string
  }
}

export interface ObserverOption {
  id: string
  firstName: string
  lastName: string
  email: string
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

export const REQUEST_HISTORY_ACTION_LABEL: Record<RequestHistoryAction, string> = {
  CREATED: 'Criação',
  UPDATED: 'Atualização',
  ASSIGNED: 'Atribuição',
  REASSIGNED: 'Reatribuição',
  STATUS_CHANGED: 'Status alterado',
  PRIORITY_CHANGED: 'Prioridade alterada',
  MESSAGE_SENT: 'Mensagem',
  CANCELLED: 'Cancelamento',
  ARCHIVED: 'Arquivamento',
}
