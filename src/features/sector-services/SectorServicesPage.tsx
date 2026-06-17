import { ArrowLeft, Layers, Pencil, Plus, PowerOff, Search, Zap } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
      const action = serviceToToggle.active ? 'desativada' : 'ativada'
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
      <Link
        to="/setores"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} />
        Voltar para setores
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-secondary p-2 text-primary">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Serviços do setor</h2>
              <p className="text-sm text-text-muted">
                Setor: <span className="font-medium text-text">{sectorName || '...'}</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-muted">
            Cada serviço cadastrado abaixo será uma{' '}
            <strong className="text-text">categoria de chamado</strong> vinculada a este setor —
            por exemplo, &quot;Manutenção de computador&quot; no setor de TI.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 whitespace-nowrap self-start sm:self-center">
          <Plus size={16} className="shrink-0" />
          Novo serviço
        </Button>
      </div>

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
                      <Badge variant={service.active ? 'success' : 'warning'}>
                        {service.active ? 'Ativo' : 'Inativo'}
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
                          variant={service.active ? 'danger' : 'secondary'}
                          onClick={() => openToggle(service)}
                          aria-label={`${service.active ? 'Desativar' : 'Ativar'} ${service.name}`}
                        >
                          {service.active ? <PowerOff size={16} /> : <Zap size={16} />}
                          <span className="hidden sm:inline">
                            {service.active ? 'Desativar' : 'Ativar'}
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
        title={serviceToToggle?.active ? 'Desativar serviço' : 'Ativar serviço'}
        description={
          serviceToToggle
            ? serviceToToggle.active
              ? `Deseja desativar o serviço "${serviceToToggle.name}"? Ele não aparecerá como categoria na abertura de novos chamados.`
              : `Deseja ativar o serviço "${serviceToToggle.name}"? Ele voltará a aparecer como categoria na abertura de chamados.`
            : undefined
        }
        confirmLabel={serviceToToggle?.active ? 'Desativar' : 'Ativar'}
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
