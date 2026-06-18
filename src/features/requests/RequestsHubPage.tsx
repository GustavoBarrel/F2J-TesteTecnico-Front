import {
  ArrowRight,
  ClipboardList,
  Inbox,
  Plus,
  UserCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { isApiError } from '../../services/api'
import * as meService from '../../services/meService'
import { useToast } from '../../contexts/ToastContext'
import { requestsHubBreadcrumbs } from '../../lib/breadcrumbs'
import { REQUEST_STATUS_LABEL } from '../../types/request.types'
import type { MeSector, RequestStatus } from '../../types/request.types'

const STATUS_COLOR: Record<RequestStatus, string> = {
  NEW: 'bg-primary/10 text-primary',
  PENDING: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  ARCHIVED: 'bg-secondary text-text-muted',
}

const ACTIVE_STATUSES: RequestStatus[] = ['NEW', 'PENDING', 'IN_PROGRESS']

function SectorCard({ sector }: { sector: MeSector }) {
  const activeCounts = sector.statusCounts.filter((s) =>
    ACTIVE_STATUSES.includes(s.status),
  )
  const totalActive = activeCounts.reduce((acc, s) => acc + s.count, 0)

  return (
    <Link
      to={`/solicitacoes/setores/${sector.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text">{sector.name}</p>
          {sector.role ? (
            <p className="text-xs text-text-muted">
              {sector.role === 'MANAGER' ? 'Gestor' : 'Técnico'}
            </p>
          ) : null}
        </div>
        <ArrowRight
          size={16}
          className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
        />
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
        <p className="text-xs text-text-muted">{totalActive} ativas no total</p>
      ) : null}
    </Link>
  )
}

export function RequestsHubPage() {
  const { showToast } = useToast()
  const [sectors, setSectors] = useState<MeSector[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    meService
      .getMySectors()
      .then(setSectors)
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [showToast])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={requestsHubBreadcrumbs}
        icon={<ClipboardList size={20} />}
        title="Solicitações"
        description="Acompanhe e gerencie todas as suas solicitações entre setores."
        actions={
          <Link to="/solicitacoes/nova">
            <Button variant="primary">
              <Plus size={16} />
              Nova solicitação
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/solicitacoes/minhas"
          className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-secondary p-3 text-primary">
            <Inbox size={20} />
          </div>
          <div>
            <p className="font-semibold text-text">Minhas solicitações</p>
            <p className="text-sm text-text-muted">Criadas por você</p>
          </div>
          <ArrowRight size={16} className="ml-auto shrink-0 text-text-muted" />
        </Link>

        <Link
          to="/solicitacoes/atribuidas"
          className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-secondary p-3 text-primary">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="font-semibold text-text">Atribuídas a mim</p>
            <p className="text-sm text-text-muted">Aguardando sua ação</p>
          </div>
          <ArrowRight size={16} className="ml-auto shrink-0 text-text-muted" />
        </Link>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wide">
          Meus setores
        </h3>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-border bg-secondary/40"
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
