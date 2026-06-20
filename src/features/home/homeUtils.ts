import type { MeSector, Request, RequestPriority, RequestStatus } from '../../types/request.types'

export const ACTIVE_STATUSES: RequestStatus[] = ['NEW', 'PENDING', 'IN_PROGRESS', 'SOLVED']

export const WORK_STATUSES: RequestStatus[] = ['NEW', 'PENDING', 'IN_PROGRESS']

export const FINAL_STATUSES: RequestStatus[] = ['COMPLETED', 'CANCELLED', 'ARCHIVED']

export const OPEN_STATUSES = ACTIVE_STATUSES

const PRIORITY_WEIGHT: Record<RequestPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const STATUS_WEIGHT: Record<RequestStatus, number> = {
  SOLVED: 5,
  NEW: 4,
  IN_PROGRESS: 3,
  PENDING: 2,
  COMPLETED: 1,
  CANCELLED: 0,
  ARCHIVED: 0,
}

export type ActionContext = 'assigned' | 'approval'

export interface ActionInboxItem {
  request: Request
  context: ActionContext
}

export function isManagerSector(sector: MeSector): boolean {
  return sector.role === 'MANAGER'
}

export function isOpenStatus(status: RequestStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export function isWorkStatus(status: RequestStatus): boolean {
  return WORK_STATUSES.includes(status)
}

export function isFinalStatus(status: RequestStatus): boolean {
  return FINAL_STATUSES.includes(status)
}

export function needsRequesterReview(request: Request, userId?: string): boolean {
  return request.status === 'SOLVED' && request.createdById === userId
}

export function sortByUrgency(a: Request, b: Request): number {
  const statusDiff = STATUS_WEIGHT[b.status] - STATUS_WEIGHT[a.status]
  if (statusDiff !== 0) return statusDiff
  const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
  if (priorityDiff !== 0) return priorityDiff
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function countSectorOpen(sectors: MeSector[]): number {
  return sectors.reduce((total, sector) => {
    const sectorTotal = sector.statusCounts
      .filter((sc) => OPEN_STATUSES.includes(sc.status))
      .reduce((acc, sc) => acc + sc.count, 0)
    return total + sectorTotal
  }, 0)
}

export function filterSectorPreviewRequests(
  requests: Request[],
  limit: number,
): Request[] {
  return requests.sort(sortByUrgency).slice(0, limit)
}

export function filterAssignedActiveRequests(requests: Request[]): Request[] {
  return requests.filter(
    (r) => r.assignees.length > 0 && isOpenStatus(r.status),
  )
}

export function filterFinalRequests(requests: Request[], limit: number): Request[] {
  return requests.filter((r) => isFinalStatus(r.status)).sort(sortByUrgency).slice(0, limit)
}

/** @deprecated use filterAssignedActiveRequests */
export function filterAssignedInProgressRequests(requests: Request[]): Request[] {
  return filterAssignedActiveRequests(requests)
}

export function countAssignedActive(requests: Request[]): number {
  return filterAssignedActiveRequests(requests).length
}

export function formatAssignees(request: Request): string {
  if (request.assignees.length === 0) return 'Sem responsável'
  return request.assignees.map((a) => `@${a.username}`).join(', ')
}

export function buildActionInbox(
  assigned: Request[],
  myRequests: Request[],
  userId: string,
  limit = 10,
): ActionInboxItem[] {
  const items: ActionInboxItem[] = []

  for (const request of assigned.filter((r) => isOpenStatus(r.status)).sort(sortByUrgency)) {
    items.push({ request, context: 'assigned' })
  }

  for (const request of myRequests
    .filter((r) => r.createdById === userId && r.status === 'SOLVED')
    .sort(sortByUrgency)) {
    const existingIndex = items.findIndex((item) => item.request.id === request.id)
    if (existingIndex >= 0) {
      items[existingIndex] = { request, context: 'approval' }
    } else {
      items.push({ request, context: 'approval' })
    }
  }

  return items.sort((a, b) => sortByUrgency(a.request, b.request)).slice(0, limit)
}

export function getSectorRestrictionNotes(sector: MeSector): string[] {
  const notes: string[] = []

  if (sector.onlyManagerCanView) {
    notes.push('visualização restrita ao gestor')
  }
  if (sector.onlyManagerCanEdit) {
    notes.push('edição restrita ao gestor')
  }
  if (sector.onlyManagerCanArchive) {
    notes.push('arquivamento restrito ao gestor')
  }

  return notes
}

export function getSectorRoleLabel(sector: MeSector): string {
  if (sector.role === 'MANAGER') return 'Gestor'
  if (sector.role === 'TECHNICIAN') return 'Técnico'
  return 'Membro'
}

export const ACTION_CONTEXT_LABEL: Record<ActionContext, string> = {
  assigned: 'Atribuída a você',
  approval: 'Aguardando sua aprovação',
}

export function getActionContextLabel(
  context: ActionContext,
  request: Request,
): string {
  if (context === 'assigned' && request.status === 'SOLVED') {
    return 'Aguardando aprovação do requerente'
  }
  return ACTION_CONTEXT_LABEL[context]
}
