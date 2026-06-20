import { Building2, CheckCircle2, ClipboardList, UserCheck } from 'lucide-react'

interface SummaryChip {
  id: string
  label: string
  count: number
  href: string
  icon: typeof UserCheck
  accent: string
}

interface HomeSummaryChipsProps {
  actionCount: number
  myOpenCount: number
  sectorActiveCount: number
  completedCount: number
  hasSectors: boolean
}

export function HomeSummaryChips({
  actionCount,
  myOpenCount,
  sectorActiveCount,
  completedCount,
  hasSectors,
}: HomeSummaryChipsProps) {
  const chips: SummaryChip[] = [
    {
      id: 'actions',
      label: 'Precisam de ação',
      count: actionCount,
      href: '#acao-pendente',
      icon: UserCheck,
      accent: 'border-accent/30 bg-accent/5 text-accent',
    },
    {
      id: 'my-open',
      label: 'Minhas importantes',
      count: myOpenCount,
      href: '#minhas-abertas',
      icon: ClipboardList,
      accent: 'border-primary/20 bg-primary/5 text-primary',
    },
  ]

  if (hasSectors) {
    chips.push({
      id: 'sector-active',
      label: 'Demandas dos setores',
      count: sectorActiveCount,
      href: '#setores',
      icon: Building2,
      accent: 'border-amber-200 bg-amber-50 text-amber-800',
    })
  }

  chips.push({
    id: 'completed',
    label: 'Concluídas recentes',
    count: completedCount,
    href: '#concluidas-recentes',
    icon: CheckCircle2,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  })

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const Icon = chip.icon
        return (
          <a
            key={chip.id}
            href={chip.href}
            className={[
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:opacity-90',
              chip.accent,
            ].join(' ')}
          >
            <Icon size={15} />
            <span>{chip.label}</span>
            <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
              {chip.count}
            </span>
          </a>
        )
      })}
    </div>
  )
}
