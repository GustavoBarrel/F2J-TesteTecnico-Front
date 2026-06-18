import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs'

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  icon: ReactNode
  title: string
  subtitle?: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  breadcrumbs,
  icon,
  title,
  subtitle,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-secondary p-2 text-primary">{icon}</div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary">{title}</h2>
              {subtitle ? <p className="text-sm text-text-muted">{subtitle}</p> : null}
            </div>
          </div>
          {description ? (
            <p className="mt-3 text-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0 self-start sm:self-center">{actions}</div> : null}
      </div>
    </header>
  )
}
