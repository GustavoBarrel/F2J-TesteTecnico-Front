interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="ServiceHub — Solicitação intersetorial"
      className={['block max-w-full object-contain', className].filter(Boolean).join(' ')}
    />
  )
}
