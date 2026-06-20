import { ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { newRequestBreadcrumbs } from '../../lib/breadcrumbs'
import { NewRequestForm } from './NewRequestForm'

export function NewRequestPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        breadcrumbs={newRequestBreadcrumbs}
        icon={<ClipboardList size={20} />}
        title="Nova solicitação"
        description="Preencha os dados abaixo para abrir uma solicitação a um setor. Você pode incluir observadores opcionalmente."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <NewRequestForm
          descriptionId="new-request-description-page"
          onCancel={() => navigate('/', { replace: true })}
          onSuccess={(id) => navigate(`/solicitacoes/${id}`)}
        />
      </section>
    </div>
  )
}
