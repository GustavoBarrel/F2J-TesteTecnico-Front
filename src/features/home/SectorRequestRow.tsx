import { Link } from 'react-router-dom'
import type { Request } from '../../types/request.types'
import { RequestPriorityBadge, RequestStatusBadge } from '../requests/RequestBadges'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

interface SectorRequestRowProps {
  request: Request
  showAssignees?: boolean
}

export function SectorRequestRow({ request, showAssignees = false }: SectorRequestRowProps) {
  const assigneeLabel =
    request.assignees.length > 0
      ? request.assignees.map((a) => `@${a.username}`).join(', ')
      : 'Sem responsável'

  return (
    <Link
      to={`/solicitacoes/${request.id}`}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 transition-all hover:border-accent/40 hover:bg-secondary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text group-hover:text-primary">
          {request.title}
        </p>
        {showAssignees ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium text-text-muted">Responsável:</span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {assigneeLabel}
            </span>
          </p>
        ) : null}
        <p className="mt-1 text-xs text-text-muted">
          Atualizado em {dateFormatter.format(new Date(request.updatedAt))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
        <RequestStatusBadge status={request.status} />
        <RequestPriorityBadge priority={request.priority} />
      </div>
    </Link>
  )
}
