import { Badge } from '../../components/ui/Badge'
import {
  REQUEST_PARTICIPATION_LABEL,
  REQUEST_PRIORITY_LABEL,
  REQUEST_STATUS_LABEL,
  type RequestParticipationRole,
  type RequestPriority,
  type RequestStatus,
} from '../../types/request.types'

type BadgeVariant = 'success' | 'warning' | 'neutral' | 'primary' | 'danger' | 'info'

const STATUS_VARIANT: Record<RequestStatus, BadgeVariant> = {
  NEW: 'primary',
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  SOLVED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'neutral',
}

const PRIORITY_VARIANT: Record<RequestPriority, BadgeVariant> = {
  LOW: 'neutral',
  MEDIUM: 'warning',
  HIGH: 'warning',
  URGENT: 'danger',
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{REQUEST_STATUS_LABEL[status]}</Badge>
  )
}

export function RequestPriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]}>
      {REQUEST_PRIORITY_LABEL[priority]}
    </Badge>
  )
}

const PARTICIPATION_VARIANT: Record<RequestParticipationRole, BadgeVariant> = {
  CREATOR: 'primary',
  OBSERVER: 'info',
}

export function RequestParticipationBadges({
  roles,
}: {
  roles: RequestParticipationRole[]
}) {
  if (roles.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant={PARTICIPATION_VARIANT[role]}>
          {REQUEST_PARTICIPATION_LABEL[role]}
        </Badge>
      ))}
    </div>
  )
}
