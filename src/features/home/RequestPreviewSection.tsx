import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getRequestParticipationRoles,
  type Request,
} from '../../types/request.types'
import {
  RequestParticipationBadges,
  RequestPriorityBadge,
  RequestStatusBadge,
} from '../requests/RequestBadges'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

interface RequestPreviewSectionProps {
  title: string
  description: string
  icon: LucideIcon
  viewAllHref: string
  requests: Request[]
  total: number
  isLoading: boolean
  emptyMessage: string
  showParticipation?: boolean
  userId?: string
}

function RequestPreviewRow({
  request,
  showParticipation,
  userId,
}: {
  request: Request
  showParticipation?: boolean
  userId?: string
}) {
  return (
    <Link
      to={`/solicitacoes/${request.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3 transition-colors hover:border-accent/40 hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text">{request.title}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Atualizada em {dateFormatter.format(new Date(request.updatedAt))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
        {showParticipation && userId ? (
          <RequestParticipationBadges
            roles={getRequestParticipationRoles(request, userId)}
          />
        ) : null}
        <RequestStatusBadge status={request.status} />
        <RequestPriorityBadge priority={request.priority} />
      </div>
    </Link>
  )
}

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg border border-border bg-secondary/40"
        />
      ))}
    </div>
  )
}

export function RequestPreviewSection({
  title,
  description,
  icon: Icon,
  viewAllHref,
  requests,
  total,
  isLoading,
  emptyMessage,
  showParticipation = false,
  userId,
}: RequestPreviewSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2.5 text-primary">
            <Icon size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-text">{title}</h2>
            <p className="text-sm text-text-muted">{description}</p>
          </div>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Ver todas{total > 0 ? ` (${total})` : ''}
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <PreviewSkeleton />
      ) : requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((request) => (
            <RequestPreviewRow
              key={request.id}
              request={request}
              showParticipation={showParticipation}
              userId={userId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
