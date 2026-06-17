interface LogoPlaceholderProps {
  className?: string
}

export function LogoPlaceholder({ className = '' }: LogoPlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={['rounded-lg bg-accent/30', className].filter(Boolean).join(' ')}
    />
  )
}
