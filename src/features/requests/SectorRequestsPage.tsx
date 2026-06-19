import { Building2, Search } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import * as sectorService from '../../services/sectorService'
import * as requestService from '../../services/requestService'
import { useToast } from '../../contexts/ToastContext'
import { sectorRequestsBreadcrumbs } from '../../lib/breadcrumbs'
import type {
  Request,
  RequestPriority,
  RequestStatus,
} from '../../types/request.types'
import { RequestPriorityBadge, RequestStatusBadge } from './RequestBadges'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'NEW', label: 'Nova' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'ARCHIVED', label: 'Arquivada' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas as prioridades' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function SectorRequestsPage() {
  const { sectorId } = useParams<{ sectorId: string }>()
  const { showToast } = useToast()

  const [sectorName, setSectorName] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [queueOnly, setQueueOnly] = useState(false)

  useEffect(() => {
    if (!sectorId) return
    sectorService
      .getSector(sectorId)
      .then((s) => setSectorName(s.name))
      .catch(() => {})
  }, [sectorId])

  const load = useCallback(async () => {
    if (!sectorId) return
    setIsLoading(true)
    try {
      const res = await requestService.getSectorRequests(sectorId, {
        page,
        limit: 10,
        status: (statusFilter as RequestStatus) || undefined,
        priority: (priorityFilter as RequestPriority) || undefined,
        search: search || undefined,
        scope: queueOnly ? 'queue' : undefined,
      })
      setRequests(res.data)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [sectorId, page, statusFilter, priorityFilter, search, queueOnly, showToast])

  useEffect(() => {
    void load()
  }, [load])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={sectorRequestsBreadcrumbs(sectorName)}
        icon={<Building2 size={20} />}
        title={sectorName || 'Solicitações do setor'}
        description="Visualize e gerencie as solicitações deste setor."
      />

      <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3">
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={handleSearchSubmit}
          >
            <Input
              label="Buscar"
              hideLabel
              name="search"
              placeholder="Buscar por título ou descrição..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Buscar
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                label="Status"
                hideLabel
                name="status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="w-44">
              <Select
                label="Prioridade"
                hideLabel
                name="priority"
                options={PRIORITY_OPTIONS}
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={queueOnly}
                onChange={(e) => {
                  setQueueOnly(e.target.checked)
                  setPage(1)
                }}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Apenas fila (sem atribuído)
            </label>
          </div>
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
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Atribuídos</th>
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
                    <td className="px-4 py-4">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-4">
                      <RequestPriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-4 text-text-muted">
                      {req.assignees.length > 0
                        ? req.assignees
                            .map((a) => `${a.firstName} ${a.lastName}`)
                            .join(', ')
                        : '—'}
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
