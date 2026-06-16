type BadgeVariant = 'success' | 'warning' | 'neutral' | 'primary'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-secondary text-text-muted',
  primary: 'bg-primary/10 text-primary',
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
