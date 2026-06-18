import { useCallback } from 'react'
import { assignedRequestsBreadcrumbs } from '../../lib/breadcrumbs'
import * as requestService from '../../services/requestService'
import type { PaginatedRequests, RequestStatus } from '../../types/request.types'
import { RequestListPage } from './RequestListPage'

export function AssignedRequestsPage() {
  const fetchRequests = useCallback(
    (params: { page: number; limit: number; status?: RequestStatus }) =>
      requestService.getAssignedRequests(params) as Promise<PaginatedRequests>,
    [],
  )

  return (
    <RequestListPage
      breadcrumbs={assignedRequestsBreadcrumbs}
      title="Atribuídas a mim"
      description="Solicitações nas quais você foi designado como responsável."
      fetchRequests={fetchRequests}
    />
  )
}
