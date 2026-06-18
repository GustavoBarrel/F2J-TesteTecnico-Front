import { Layers, Pencil, Plus, PowerOff, Search, Zap } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { isApiError } from '../../services/api'
import * as sectorService from '../../services/sectorService'
import * as sectorServicesService from '../../services/sectorServicesService'
import type { SectorServiceItem } from '../../types/sector-service.types'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { SectorServiceFormModal } from './SectorServiceFormModal'
import { PageHeader } from '../../components/layout/PageHeader'
import { sectorServicesBreadcrumbs } from '../../lib/breadcrumbs'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function SectorServicesPage() {
  const { sectorId = '' } = useParams()
  const { showToast } = useToast()

  const [sectorName, setSectorName] = useState('')
  const [services, setServices] = useState<SectorServiceItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedService, setSelectedService] = useState<SectorServiceItem | null>(null)

  const [toggleOpen, setToggleOpen] = useState(false)
  const [serviceToToggle, setServiceToToggle] = useState<SectorServiceItem | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const loadSector = useCallback(async () => {
    try {
      const sector = await sectorService.getSector(sectorId)
      setSectorName(sector.name)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      }
    }
  }, [sectorId, showToast])

  const loadServices = useCallback(async () => {
    if (!sectorId) return

    setIsLoading(true)

    try {
      const response = await sectorServicesService.getSectorServices(sectorId, {
        page,
        limit: 10,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })

      setServices(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os serviços do setor.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [sectorId, page, search, statusFilter, showToast])

  useEffect(() => {
    void loadSector()
  }, [loadSector])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function openCreate() {
    setFormMode('create')
    setSelectedService(null)
    setFormOpen(true)
  }

  function openEdit(service: SectorServiceItem) {
    setFormMode('edit')
    setSelectedService(service)
    setFormOpen(true)
  }

  function openToggle(service: SectorServiceItem) {
    setServiceToToggle(service)
    setToggleOpen(true)
  }

  async function handleToggle() {
    if (!serviceToToggle || !sectorId) return

    setIsToggling(true)

    try {
      await sectorServicesService.toggleSectorServiceActive(sectorId, serviceToToggle.id)
      const action = serviceToToggle.isActive ? 'desativada' : 'ativada'
      showToast(`Serviço ${action} com sucesso.`, 'success')
      setToggleOpen(false)
      setServiceToToggle(null)
      void loadServices()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível alterar o status do serviço.')
      }
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={sectorServicesBreadcrumbs(sectorName)}
        icon={<Layers size={20} />}
        title="Serviços do setor"
        description={
          <>
            Cada serviço cadastrado abaixo será uma{' '}
            <strong className="text-text">categoria de chamado</strong> vinculada a este setor —
            por exemplo, &quot;Manutenção de computador&quot; no setor de TI.
          </>
        }
        actions={
          <Button onClick={openCreate} className="whitespace-nowrap">
            <Plus size={16} className="shrink-0" />
            Novo serviço
          </Button>
        }
      />

      <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
        <form
          className="grid gap-4 md:grid-cols-[1fr_auto_auto]"
          onSubmit={handleSearchSubmit}
        >
          <Input
            name="search"
            label="Pesquisar"
            placeholder="Nome do serviço"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Select
            name="status"
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ]}
          />
          <div className="flex items-end">
            <Button type="submit" variant="secondary" fullWidth>
              <Search size={16} />
              Buscar
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 lg:px-5">
          <p className="text-sm text-text-muted">{total} serviço(s) encontrado(s)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-text-muted lg:px-5">
            Nenhum serviço cadastrado para este setor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/50 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium lg:px-5">Serviço</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Status</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium lg:px-5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-border">
                    <td className="px-4 py-4 font-medium text-text lg:px-5">{service.name}</td>
                    <td className="px-4 py-4 lg:px-5">
                      <Badge variant={service.isActive ? 'success' : 'warning'}>
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">
                      {dateFormatter.format(new Date(service.createdAt))}
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(service)}
                          aria-label={`Editar ${service.name}`}
                        >
                          <Pencil size={16} />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant={service.isActive ? 'danger' : 'secondary'}
                          onClick={() => openToggle(service)}
                          aria-label={`${service.isActive ? 'Desativar' : 'Ativar'} ${service.name}`}
                        >
                          {service.isActive ? <PowerOff size={16} /> : <Zap size={16} />}
                          <span className="hidden sm:inline">
                            {service.isActive ? 'Desativar' : 'Ativar'}
                          </span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border px-4 py-4 lg:px-5">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      <SectorServiceFormModal
        open={formOpen}
        mode={formMode}
        sectorId={sectorId}
        sectorName={sectorName}
        service={selectedService}
        onClose={() => setFormOpen(false)}
        onSuccess={() => void loadServices()}
      />

      <ConfirmDeleteModal
        open={toggleOpen}
        title={serviceToToggle?.isActive ? 'Desativar serviço' : 'Ativar serviço'}
        description={
          serviceToToggle
            ? serviceToToggle.isActive
              ? `Deseja desativar o serviço "${serviceToToggle.name}"? Ele não aparecerá como categoria na abertura de novos chamados.`
              : `Deseja ativar o serviço "${serviceToToggle.name}"? Ele voltará a aparecer como categoria na abertura de chamados.`
            : undefined
        }
        confirmLabel={serviceToToggle?.isActive ? 'Desativar' : 'Ativar'}
        isLoading={isToggling}
        onConfirm={() => void handleToggle()}
        onCancel={() => {
          setToggleOpen(false)
          setServiceToToggle(null)
        }}
      />
    </div>
  )
}
