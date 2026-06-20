import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  hideLabel?: boolean
}

export function Select({ label, options, error, hint, id, className = '', hideLabel = false, ...props }: SelectProps) {
  const selectId = id ?? props.name

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label
        htmlFor={selectId}
        className={hideLabel ? 'sr-only' : 'text-sm font-medium text-text'}
      >
        {label}
      </label>
      <select
        id={selectId}
        className={[
          'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors',
          'focus:border-accent focus:ring-2 focus:ring-accent/20',
          error ? 'border-danger' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error ? <p className="text-xs text-text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}
