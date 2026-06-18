import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { homeBreadcrumbs } from '../../lib/breadcrumbs'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={homeBreadcrumbs}
        icon={<LayoutDashboard size={20} />}
        title={`Bem-vindo, ${user?.username}`}
        description="Você está conectado à central de serviços. A partir daqui poderá solicitar atendimentos entre os setores da empresa."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-primary">Próximos passos</h3>
          <p className="mt-2 text-sm text-text-muted">
            Os módulos de solicitações e setores serão adicionados conforme a evolução do sistema.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-primary">Seu perfil</h3>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              <span className="font-medium text-text">E-mail:</span> {user?.email}
            </li>
            <li>
              <span className="font-medium text-text">Usuário:</span> {user?.username}
            </li>
            <li>
              <span className="font-medium text-text">Perfil:</span>{' '}
              {user?.isGlobalAdmin ? 'Administrador global' : 'Usuário'}
            </li>
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-surface/80 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowRight size={16} />
          Área pronta para novos módulos
        </div>
        <p className="mt-2 text-sm text-text-muted">
          A home já está protegida por autenticação. Somente usuários com token válido conseguem
          acessar esta página.
        </p>
      </section>
    </div>
  )
}
