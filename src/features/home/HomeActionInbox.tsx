import { AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequestPriorityBadge, RequestStatusBadge } from '../requests/RequestBadges'
import type { Request } from '../../types/request.types'
import { getActionContextLabel, type ActionInboxItem } from './homeUtils'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const CONTEXT_VARIANT = {
  assigned: 'bg-accent/10 text-accent',
  approval: 'bg-emerald-50 text-emerald-700',
} as const

function inboxContextVariant(context: ActionInboxItem['context'], status: Request['status']) {
  if (context === 'assigned' && status === 'SOLVED') {
    return 'bg-emerald-50 text-emerald-700'
  }
  return CONTEXT_VARIANT[context]
}

interface HomeActionInboxProps {
  items: ActionInboxItem[]
  isLoading: boolean
  assignedCount: number
  approvalCount: number
}

function InboxSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[4.5rem] animate-pulse rounded-lg border border-border bg-secondary/40"
        />
      ))}
    </div>
  )
}

export function HomeActionInbox({
  items,
  isLoading,
  assignedCount,
  approvalCount,
}: HomeActionInboxProps) {
  return (
    <section
      id="acao-pendente"
      className="scroll-mt-4 rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-surface p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
            <AlertCircle size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-text">Precisa da sua ação</h2>
            <p className="text-sm text-text-muted">
              Chamados atribuídos a você, soluções aguardando aprovação ou pendências como requerente.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/solicitacoes/atribuidas"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Atribuídas{assignedCount > 0 ? ` (${assignedCount})` : ''}
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/solicitacoes/minhas"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Minhas{approvalCount > 0 ? ` (${approvalCount})` : ''}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <InboxSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/80 px-4 py-8 text-center">
          <p className="text-sm text-text-muted">
            Nenhuma demanda pendente no momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(({ request, context }) => (
            <Link
              key={request.id}
              to={`/solicitacoes/${request.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 transition-colors hover:border-accent/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">{request.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Atualizada em {dateFormatter.format(new Date(request.updatedAt))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
                <span
                  className={[
                    'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium',
                    inboxContextVariant(context, request.status),
                  ].join(' ')}
                >
                  {getActionContextLabel(context, request)}
                </span>
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
