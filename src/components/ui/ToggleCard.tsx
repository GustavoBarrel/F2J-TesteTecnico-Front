import type { ReactNode } from 'react'

interface ToggleCardProps {
  name: string
  label: string
  description?: string
  icon?: ReactNode
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function ToggleCard({
  name,
  label,
  description,
  icon,
  checked,
  disabled = false,
  onChange,
}: ToggleCardProps) {
  return (
    <label
      htmlFor={name}
      className={[
        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
        checked
          ? 'border-accent bg-accent/5'
          : 'border-border bg-surface hover:border-accent/40 hover:bg-secondary/30',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? (
        <div
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            checked ? 'bg-accent text-white' : 'bg-secondary text-text-muted',
          ].join(' ')}
        >
          {icon}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-text">{label}</span>
        {description ? <p className="mt-0.5 text-xs text-text-muted">{description}</p> : null}
      </div>

      <div
        className={[
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-border',
        ].join(' ')}
        aria-hidden="true"
      >
        <div
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>

      <input
        id={name}
        name={name}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
