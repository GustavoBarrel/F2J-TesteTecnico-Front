type BadgeVariant = 'success' | 'warning' | 'neutral' | 'primary' | 'danger' | 'info'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  neutral: 'bg-secondary text-text-muted',
  primary: 'bg-primary/10 text-primary',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium',
        variants[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
