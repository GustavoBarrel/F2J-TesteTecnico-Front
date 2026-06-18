import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  hideLabel?: boolean
}

export function Input({
  label,
  error,
  hint,
  required = false,
  hideLabel = false,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'text-sm font-medium text-text'}
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <input
        id={inputId}
        className={[
          'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors',
          'placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20',
          error ? 'border-danger' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}
