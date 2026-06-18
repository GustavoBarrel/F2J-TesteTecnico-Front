import { useCallback } from 'react'
import { myRequestsBreadcrumbs } from '../../lib/breadcrumbs'
import * as requestService from '../../services/requestService'
import type { PaginatedRequests, RequestStatus } from '../../types/request.types'
import { RequestListPage } from './RequestListPage'

export function MyRequestsPage() {
  const fetchRequests = useCallback(
    (params: { page: number; limit: number; status?: RequestStatus }) =>
      requestService.getMyRequests(params) as Promise<PaginatedRequests>,
    [],
  )

  return (
    <RequestListPage
      breadcrumbs={myRequestsBreadcrumbs}
      title="Minhas solicitações"
      description="Solicitações abertas por você."
      fetchRequests={fetchRequests}
    />
  )
}
