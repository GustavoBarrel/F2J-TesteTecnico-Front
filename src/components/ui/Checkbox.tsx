import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name

  return (
    <label
      htmlFor={checkboxId}
      className={['flex cursor-pointer items-center gap-2 text-sm text-text', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
        {...props}
      />
      {label}
    </label>
  )
}
