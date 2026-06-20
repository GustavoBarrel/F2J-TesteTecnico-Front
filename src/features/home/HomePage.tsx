import { CheckCircle2, ClipboardList, Inbox, LayoutDashboard, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { homeBreadcrumbs } from '../../lib/breadcrumbs'
import { NewRequestFormModal } from '../requests/NewRequestFormModal'
import { HomeActionInbox } from './HomeActionInbox'
import { HomeSummaryChips } from './HomeSummaryChips'
import { RequestPreviewSection } from './RequestPreviewSection'
import { SectorOverviewPanel } from './SectorOverviewPanel'
import { useHomeDashboard } from './useHomeDashboard'

function GettingStartedCard({ onNewRequest }: { onNewRequest: () => void }) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
        <ClipboardList size={20} />
      </div>
      <h2 className="font-semibold text-text">Nenhuma demanda ativa no momento</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-text-muted">
        Abra uma solicitação para pedir serviços de outro setor. Quando houver andamento,
        aprovações ou respostas, elas aparecerão aqui.
      </p>
      <Button className="mt-4" variant="primary" onClick={onNewRequest}>
        <Plus size={16} />
        Nova solicitação
      </Button>
    </section>
  )
}

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const dashboard = useHomeDashboard(user?.sub)
  const hasAnyActivity =
    dashboard.actionItems.length > 0 ||
    dashboard.openMyTotal > 0 ||
    dashboard.sectorActiveCount > 0 ||
    dashboard.completedTotal > 0
  const isDashboardLoading =
    dashboard.isLoadingAction || dashboard.isLoadingMy || dashboard.isLoadingSectors

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={homeBreadcrumbs}
        icon={<LayoutDashboard size={20} />}
        title={`Bem-vindo, ${user?.username}`}
        description="Acompanhe o que exige ação, suas solicitações importantes e as demandas dos setores em que você atua."
        actions={
          <Button variant="primary" onClick={() => setNewRequestOpen(true)}>
            <Plus size={16} />
            Nova solicitação
          </Button>
        }
      />

      <HomeSummaryChips
        actionCount={dashboard.actionItems.length}
        myOpenCount={dashboard.openMyTotal}
        sectorActiveCount={dashboard.sectorActiveCount}
        completedCount={dashboard.completedTotal}
        hasSectors={dashboard.hasSectors}
      />

      {!isDashboardLoading && !hasAnyActivity ? (
        <GettingStartedCard onNewRequest={() => setNewRequestOpen(true)} />
      ) : null}

      <HomeActionInbox
        items={dashboard.actionItems}
        isLoading={dashboard.isLoadingAction}
        assignedCount={dashboard.assignedWork.length}
        approvalCount={dashboard.pendingApproval.length}
      />

      <div id="minhas-abertas" className="scroll-mt-4">
        <RequestPreviewSection
          title="Minhas solicitações importantes"
          description="Criadas por você ou observadas, ainda sem conclusão real."
          icon={Inbox}
          viewAllHref="/solicitacoes/minhas"
          requests={dashboard.openMyRequests}
          total={dashboard.openMyTotal}
          isLoading={dashboard.isLoadingMy}
          emptyMessage="Nenhuma solicitação em aberto. Abra uma nova quando precisar de um serviço."
          showParticipation
          userId={user?.sub}
        />
      </div>

      {dashboard.hasSectors ? (
        <SectorOverviewPanel sectors={dashboard.sectorOverview} />
      ) : null}

      <div id="concluidas-recentes" className="scroll-mt-4 opacity-90">
        <RequestPreviewSection
          title="Concluídas recentes"
          description="Chamados já encerrados ficam aqui para consulta posterior."
          icon={CheckCircle2}
          viewAllHref="/solicitacoes/minhas"
          requests={dashboard.completedRequests}
          total={dashboard.completedTotal}
          isLoading={dashboard.isLoadingMy}
          emptyMessage="Nenhuma solicitação concluída recentemente."
          showParticipation
          userId={user?.sub}
        />
      </div>

      <NewRequestFormModal
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        onSuccess={(id) => navigate(`/solicitacoes/${id}`)}
      />
    </div>
  )
}
