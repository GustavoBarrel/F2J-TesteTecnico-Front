import { ClipboardList } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import type { BreadcrumbItem } from '../../components/layout/Breadcrumbs'
import {
  getRequestParticipationRoles,
  type PaginatedRequests,
  type Request,
  type RequestStatus,
} from '../../types/request.types'
import {
  RequestParticipationBadges,
  RequestPriorityBadge,
  RequestStatusBadge,
} from './RequestBadges'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'NEW', label: 'Nova' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'ARCHIVED', label: 'Arquivada' },
]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

interface RequestListPageProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  description: string
  fetchRequests: (params: {
    page: number
    limit: number
    status?: RequestStatus
  }) => Promise<PaginatedRequests>
  showParticipation?: boolean
}

export function RequestListPage({
  breadcrumbs,
  title,
  description,
  fetchRequests,
  showParticipation = false,
}: RequestListPageProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [requests, setRequests] = useState<Request[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchRequests({
        page,
        limit: 10,
        status: (statusFilter as RequestStatus) || undefined,
      })
      setRequests(res.data)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [fetchRequests, page, statusFilter, showToast])

  useEffect(() => {
    void load()
  }, [load])

  function handleStatusChange(e: FormEvent<HTMLSelectElement>) {
    setStatusFilter((e.target as HTMLSelectElement).value)
    setPage(1)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        icon={<ClipboardList size={20} />}
        title={title}
        description={description}
      />

      <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
        <div className="mb-4 max-w-xs">
          <Select
            label="Status"
            hideLabel
            name="status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-text-muted">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">Título</th>
                  {showParticipation ? (
                    <th className="px-4 py-3 font-medium">Participação</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-4">
                      <Link
                        to={`/solicitacoes/${req.id}`}
                        className="font-medium text-text hover:text-primary hover:underline"
                      >
                        {req.title}
                      </Link>
                    </td>
                    {showParticipation && user ? (
                      <td className="px-4 py-4">
                        <RequestParticipationBadges
                          roles={getRequestParticipationRoles(req, user.sub)}
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-4">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-4">
                      <RequestPriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-4 text-text-muted">
                      {dateFormatter.format(new Date(req.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="border-t border-border px-4 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
