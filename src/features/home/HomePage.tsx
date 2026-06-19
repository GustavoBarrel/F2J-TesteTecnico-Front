import { ClipboardList, Inbox, LayoutDashboard, Plus, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { isApiError } from '../../services/api'
import * as meService from '../../services/meService'
import * as requestService from '../../services/requestService'
import { useToast } from '../../contexts/ToastContext'
import { homeBreadcrumbs } from '../../lib/breadcrumbs'
import { REQUEST_STATUS_LABEL } from '../../types/request.types'
import type { MeSector, Request, RequestStatus } from '../../types/request.types'
import { RequestPreviewSection } from './RequestPreviewSection'

const STATUS_COLOR: Record<RequestStatus, string> = {
  NEW: 'bg-primary/10 text-primary',
  PENDING: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  ARCHIVED: 'bg-secondary text-text-muted',
}

const ACTIVE_STATUSES: RequestStatus[] = ['NEW', 'PENDING', 'IN_PROGRESS']
const PREVIEW_LIMIT = 5

function SectorCard({ sector }: { sector: MeSector }) {
  const activeCounts = sector.statusCounts.filter((s) =>
    ACTIVE_STATUSES.includes(s.status),
  )
  const totalActive = activeCounts.reduce((acc, s) => acc + s.count, 0)

  return (
    <Link
      to={`/solicitacoes/setores/${sector.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div>
        <p className="font-semibold text-text">{sector.name}</p>
        {sector.role ? (
          <p className="text-xs text-text-muted">
            {sector.role === 'MANAGER' ? 'Gestor' : 'Técnico'}
          </p>
        ) : null}
      </div>

      {activeCounts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeCounts.map((sc) => (
            <span
              key={sc.status}
              className={[
                'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium',
                STATUS_COLOR[sc.status],
              ].join(' ')}
            >
              {sc.count} {REQUEST_STATUS_LABEL[sc.status].toLowerCase()}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted">Nenhuma solicitação ativa</p>
      )}

      {totalActive > 0 ? (
        <p className="text-xs text-text-muted">{totalActive} ativas no setor</p>
      ) : null}
    </Link>
  )
}

export function HomePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [sectors, setSectors] = useState<MeSector[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [myRequestsTotal, setMyRequestsTotal] = useState(0)
  const [assignedRequests, setAssignedRequests] = useState<Request[]>([])
  const [assignedTotal, setAssignedTotal] = useState(0)
  const [isLoadingSectors, setIsLoadingSectors] = useState(true)
  const [isLoadingMy, setIsLoadingMy] = useState(true)
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true)

  useEffect(() => {
    setIsLoadingSectors(true)
    meService
      .getMySectors()
      .then(setSectors)
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingSectors(false))
  }, [showToast])

  useEffect(() => {
    setIsLoadingMy(true)
    requestService
      .getMyRequests({ limit: PREVIEW_LIMIT })
      .then((res) => {
        setMyRequests(res.data)
        setMyRequestsTotal(res.meta.total)
      })
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingMy(false))
  }, [showToast])

  useEffect(() => {
    setIsLoadingAssigned(true)
    requestService
      .getAssignedRequests({ limit: 15 })
      .then((res) => {
        const active = res.data.filter((r) => ACTIVE_STATUSES.includes(r.status))
        setAssignedRequests(active.slice(0, PREVIEW_LIMIT))
        setAssignedTotal(res.meta.total)
      })
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingAssigned(false))
  }, [showToast])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={homeBreadcrumbs}
        icon={<LayoutDashboard size={20} />}
        title={`Bem-vindo, ${user?.username}`}
        description="Acompanhe suas solicitações e o que precisa da sua atenção."
        actions={
          <Link to="/solicitacoes/nova">
            <Button variant="primary">
              <Plus size={16} />
              Nova solicitação
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RequestPreviewSection
          title="Minhas solicitações"
          description="Criadas por você ou em que você observa."
          icon={Inbox}
          viewAllHref="/solicitacoes/minhas"
          requests={myRequests}
          total={myRequestsTotal}
          isLoading={isLoadingMy}
          emptyMessage="Você ainda não tem solicitações. Abra uma nova quando precisar de um serviço."
          showParticipation
          userId={user?.sub}
        />

        <RequestPreviewSection
          title="Atribuídas a mim"
          description="Solicitações ativas aguardando sua ação."
          icon={UserCheck}
          viewAllHref="/solicitacoes/atribuidas"
          requests={assignedRequests}
          total={assignedTotal}
          isLoading={isLoadingAssigned}
          emptyMessage="Nenhuma solicitação ativa atribuída a você no momento."
        />
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Meus setores
          </h3>
        </div>

        {isLoadingSectors ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-border bg-secondary/40"
              />
            ))}
          </div>
        ) : sectors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-sm text-text-muted">
              Você não pertence a nenhum setor ainda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s) => (
              <SectorCard key={s.id} sector={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
