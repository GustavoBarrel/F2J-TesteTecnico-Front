import {
  ArrowRight,
  Building2,
  ClipboardList,
  Eye,
  Inbox,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Request } from '../../types/request.types'
import type { SectorOverviewData } from './useHomeDashboard'
import {
  getSectorRestrictionNotes,
  getSectorRoleLabel,
  isManagerSector,
} from './homeUtils'
import { SectorRequestRow } from './SectorRequestRow'

interface SectorOverviewPanelProps {
  sectors: SectorOverviewData[]
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[4.25rem] animate-pulse rounded-lg border border-border bg-secondary/30"
        />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-text-muted">
      {message}
    </p>
  )
}

interface SubSectionProps {
  icon: typeof Inbox
  iconClass: string
  title: string
  description: string
  viewAllHref: string
  viewAllLabel: string
  total: number
  isLoading: boolean
  requests: Request[]
  emptyMessage: string
  showAssignees?: boolean
}

function SubSection({
  icon: Icon,
  iconClass,
  title,
  description,
  viewAllHref,
  viewAllLabel,
  total,
  isLoading,
  requests,
  emptyMessage,
  showAssignees = false,
}: SubSectionProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={['rounded-lg p-2', iconClass].join(' ')}>
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{description}</p>
          </div>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          {viewAllLabel}
          {total > 0 ? ` (${total})` : ''}
          <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : requests.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((request) => (
            <SectorRequestRow
              key={request.id}
              request={request}
              showAssignees={showAssignees}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SectorOverviewPanel({ sectors }: SectorOverviewPanelProps) {
  const [activeSectorId, setActiveSectorId] = useState(sectors[0]?.sector.id ?? '')

  useEffect(() => {
    if (sectors.length === 0) return
    if (!sectors.some((s) => s.sector.id === activeSectorId)) {
      setActiveSectorId(sectors[0].sector.id)
    }
  }, [sectors, activeSectorId])

  if (sectors.length === 0) return null

  const active =
    sectors.find((s) => s.sector.id === activeSectorId) ?? sectors[0]
  const { sector } = active
  const isManager = isManagerSector(sector)
  const sectorBase = `/solicitacoes/setores/${sector.id}`
  const restrictionNotes = getSectorRestrictionNotes(sector)

  return (
    <section id="setores" className="scroll-mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Demandas dos meus setores</h2>
            <p className="mt-0.5 max-w-xl text-sm text-text-muted">
              Acompanhe fila, atendimento em andamento e restrições de visibilidade do setor.
            </p>
          </div>
        </div>

        {sectors.length === 1 ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-medium text-text">{sector.name}</span>
            {sector.role ? (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                {getSectorRoleLabel(sector)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {sectors.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sectors.map(({ sector: s, queueTotal, assignedTotal, activeTotal }) => {
            const isActive = s.id === active.sector.id
            const activeCount = activeTotal || queueTotal + assignedTotal
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSectorId(s.id)}
                className={[
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-muted hover:border-primary/30 hover:text-text',
                ].join(' ')}
              >
                {s.name}
                {activeCount > 0 ? (
                  <span className="ml-1.5 tabular-nums opacity-80">({activeCount})</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div className="rounded-lg bg-surface p-2 text-primary shadow-sm">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              {sector.name} · {getSectorRoleLabel(sector)}
            </p>
            <p className="text-xs text-text-muted">
              {restrictionNotes.length > 0
                ? `Configurações: ${restrictionNotes.join(', ')}.`
                : 'Sem restrições adicionais configuradas para gerente.'}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-text-muted">
          <Eye size={13} />
          {active.activeTotal} ativas
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="setor-fila-em-aberto" className="scroll-mt-4">
          <SubSection
            icon={Inbox}
            iconClass="bg-amber-50 text-amber-700"
            title="Em aberto na fila"
            description="Chamados aguardando responsável — disponíveis para atribuição ou atendimento."
            viewAllHref={`${sectorBase}?fila=1`}
            viewAllLabel="Ver fila"
            total={active.queueTotal}
            isLoading={active.isLoading}
            requests={active.queueRequests}
            emptyMessage="Nenhum chamado aguardando na fila deste setor."
          />
        </div>

        <div id="setor-atribuidos" className="scroll-mt-4">
          <SubSection
            icon={UserCheck}
            iconClass="bg-blue-50 text-blue-700"
            title="Atribuídos em tratamento"
            description={
              isManager
                ? 'Chamados com responsável, em andamento ou aguardando aprovação do requerente.'
                : 'Chamados visíveis para seu perfil, em andamento ou aguardando aprovação do requerente.'
            }
            viewAllHref={`${sectorBase}?andamento=1`}
            viewAllLabel="Ver todos"
            total={active.assignedTotal}
            isLoading={active.isLoading}
            requests={active.assignedRequests}
            emptyMessage="Nenhum chamado atribuído em tratamento neste setor."
            showAssignees
          />
        </div>
      </div>

      <Link
        to={sectorBase}
        className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/40 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-secondary/70 sm:px-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-surface p-2.5 text-primary shadow-sm">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="font-medium text-text group-hover:text-primary">
              Ver listagem completa do setor
            </p>
            <p className="text-sm text-text-muted">
              Todos os chamados de {sector.name} — filtros, busca e histórico.
            </p>
          </div>
        </div>
        <ArrowRight
          size={18}
          className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </Link>
    </section>
  )
}
