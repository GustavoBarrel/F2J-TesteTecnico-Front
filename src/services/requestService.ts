import { api } from './api'
import type {
  AssignPayload,
  ChangeStatusPayload,
  SolutionReviewPayload,
  CreateRequestPayload,
  PaginatedRequestMessages,
  PaginatedRequests,
  Request,
  RequestDetail,
  RequestHistoryEntry,
  RequestMessage,
  RequestMessagesQuery,
  RequestsQuery,
  SectorMemberOption,
  ObserverOption,
  SectorRequestsQuery,
  SectorWithServicesOption,
  UpdateRequestPayload,
} from '../types/request.types'

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v))
  }
  const q = search.toString()
  return q ? `?${q}` : ''
}

type AssignPayloadAlias = AssignPayload

export function getMyRequests(params: RequestsQuery = {}): Promise<PaginatedRequests> {
  return api<PaginatedRequests>(
    `/me/requests${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
  )
}

export function getAssignedRequests(
  params: RequestsQuery = {},
): Promise<PaginatedRequests> {
  return api<PaginatedRequests>(
    `/me/requests/assigned${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
  )
}

export function getSectorRequests(
  sectorId: string,
  params: SectorRequestsQuery = {},
): Promise<PaginatedRequests> {
  return api<PaginatedRequests>(
    `/sectors/${sectorId}/requests${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
  )
}

export function getRequest(id: string): Promise<RequestDetail> {
  return api<RequestDetail>(`/requests/${id}`)
}

export function createRequest(payload: CreateRequestPayload): Promise<Request> {
  return api<Request>('/requests', { method: 'POST', body: payload })
}

export function updateRequest(
  id: string,
  payload: UpdateRequestPayload,
): Promise<Request> {
  return api<Request>(`/requests/${id}`, { method: 'PATCH', body: payload })
}

export function changeRequestStatus(
  id: string,
  payload: ChangeStatusPayload,
): Promise<Request> {
  return api<Request>(`/requests/${id}/status`, { method: 'PATCH', body: payload })
}

export function reviewSolution(
  id: string,
  payload: SolutionReviewPayload,
): Promise<Request> {
  return api<Request>(`/requests/${id}/solution-review`, {
    method: 'PATCH',
    body: payload,
  })
}

export function assignRequest(
  id: string,
  payload: AssignPayloadAlias,
): Promise<Request> {
  return api<Request>(`/requests/${id}/assign`, { method: 'PATCH', body: payload })
}

export function setObservers(
  id: string,
  payload: AssignPayloadAlias,
): Promise<Request> {
  return api<Request>(`/requests/${id}/observers`, { method: 'PATCH', body: payload })
}

export function cancelRequest(id: string): Promise<Request> {
  return api<Request>(`/requests/${id}/cancel`, { method: 'PATCH' })
}

export function archiveRequest(id: string): Promise<Request> {
  return api<Request>(`/requests/${id}/archive`, { method: 'PATCH' })
}

export function getMessages(
  id: string,
  params: RequestMessagesQuery = {},
): Promise<PaginatedRequestMessages> {
  return api<PaginatedRequestMessages>(
    `/requests/${id}/messages${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
  )
}

export function sendMessage(
  id: string,
  content: string,
): Promise<RequestMessage> {
  return api<RequestMessage>(`/requests/${id}/messages`, {
    method: 'POST',
    body: { content },
  })
}

export function getHistory(id: string): Promise<RequestHistoryEntry[]> {
  return api<RequestHistoryEntry[]>(`/requests/${id}/history`)
}

export function getSectorServicesOptions(): Promise<SectorWithServicesOption[]> {
  return api<SectorWithServicesOption[]>('/sectors/services/options')
}

export function getAssigneeOptions(sectorId: string): Promise<SectorMemberOption[]> {
  return api<SectorMemberOption[]>(`/sectors/${sectorId}/assignee-options`)
}

export function getObserverOptions(search?: string): Promise<ObserverOption[]> {
  return api<ObserverOption[]>(`/requests/observer-options${buildQuery({ search })}`)
}
