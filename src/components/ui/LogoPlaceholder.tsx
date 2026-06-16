interface LogoPlaceholderProps {
  className?: string
}

export function LogoPlaceholder({ className = '' }: LogoPlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={['rounded-lg bg-primary', className].filter(Boolean).join(' ')}
    />
  )
}
