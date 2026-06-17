import { Archive, Eye, Layers, Pencil, Plus, PowerOff, Search, Zap } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isApiError } from '../../services/api'
import * as sectorService from '../../services/sectorService'
import type { Sector } from '../../types/sector.types'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { SectorFormModal } from './SectorFormModal'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

interface RestrictionBadgeProps {
  icon: React.ReactNode
  label: string
  active: boolean
  title: string
}

function RestrictionBadge({ icon, label, active, title }: RestrictionBadgeProps) {
  if (!active) return null
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
    >
      {icon}
      {label}
    </span>
  )
}

export function SectorsPage() {
  const { showToast } = useToast()

  const [sectors, setSectors] = useState<Sector[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)

  const [toggleOpen, setToggleOpen] = useState(false)
  const [sectorToToggle, setSectorToToggle] = useState<Sector | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const loadSectors = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await sectorService.getSectors({
        page,
        limit: 10,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })

      setSectors(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os setores.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, showToast])

  useEffect(() => {
    void loadSectors()
  }, [loadSectors])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function openCreate() {
    setFormMode('create')
    setSelectedSector(null)
    setFormOpen(true)
  }

  function openEdit(sector: Sector) {
    setFormMode('edit')
    setSelectedSector(sector)
    setFormOpen(true)
  }

  function openToggle(sector: Sector) {
    setSectorToToggle(sector)
    setToggleOpen(true)
  }

  async function handleToggle() {
    if (!sectorToToggle) return

    setIsToggling(true)

    try {
      await sectorService.toggleSectorActive(sectorToToggle.id)
      const action = sectorToToggle.active ? 'desativado' : 'ativado'
      showToast(`Setor ${action} com sucesso.`, 'success')
      setToggleOpen(false)
      setSectorToToggle(null)
      void loadSectors()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível alterar o status do setor.')
      }
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Setores</h2>
          <p className="mt-1 text-sm text-text-muted">
            Gerencie os setores e suas permissões de acesso a chamados
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Criar setor
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
            placeholder="Nome do setor"
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
          <p className="text-sm text-text-muted">{total} setor(es) encontrado(s)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
          </div>
        ) : sectors.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-text-muted lg:px-5">
            Nenhum setor encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/50 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium lg:px-5">Nome</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Status</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Restrições de chamados</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium lg:px-5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector) => {
                  const hasRestrictions =
                    sector.onlyManagerCanView ||
                    sector.onlyManagerCanEdit ||
                    sector.onlyManagerCanArchive

                  return (
                    <tr key={sector.id} className="border-t border-border">
                      <td className="px-4 py-4 font-medium text-text lg:px-5">
                        {sector.name}
                      </td>
                      <td className="px-4 py-4 lg:px-5">
                        <Badge variant={sector.active ? 'success' : 'warning'}>
                          {sector.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 lg:px-5">
                        {hasRestrictions ? (
                          <div className="flex flex-wrap gap-1">
                            <RestrictionBadge
                              icon={<Eye size={10} />}
                              label="Visualizar"
                              active={sector.onlyManagerCanView}
                              title="Somente o gerente pode visualizar os chamados"
                            />
                            <RestrictionBadge
                              icon={<Pencil size={10} />}
                              label="Editar"
                              active={sector.onlyManagerCanEdit}
                              title="Somente o gerente pode editar os chamados"
                            />
                            <RestrictionBadge
                              icon={<Archive size={10} />}
                              label="Arquivar"
                              active={sector.onlyManagerCanArchive}
                              title="Somente o gerente pode arquivar os chamados"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Sem restrições</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-text-muted lg:px-5">
                        {dateFormatter.format(new Date(sector.createdAt))}
                      </td>
                      <td className="px-4 py-4 lg:px-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/setores/${sector.id}/servicos`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-secondary/80"
                            aria-label={`Serviços do setor ${sector.name}`}
                          >
                            <Layers size={16} />
                            <span className="hidden sm:inline">Serviços</span>
                          </Link>
                          <Button
                            variant="secondary"
                            onClick={() => openEdit(sector)}
                            aria-label={`Editar ${sector.name}`}
                          >
                            <Pencil size={16} />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            variant={sector.active ? 'danger' : 'secondary'}
                            onClick={() => openToggle(sector)}
                            aria-label={`${sector.active ? 'Desativar' : 'Ativar'} ${sector.name}`}
                          >
                            {sector.active ? <PowerOff size={16} /> : <Zap size={16} />}
                            <span className="hidden sm:inline">
                              {sector.active ? 'Desativar' : 'Ativar'}
                            </span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border px-4 py-4 lg:px-5">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      <SectorFormModal
        open={formOpen}
        mode={formMode}
        sector={selectedSector}
        onClose={() => setFormOpen(false)}
        onSuccess={() => void loadSectors()}
      />

      <ConfirmDeleteModal
        open={toggleOpen}
        title={sectorToToggle?.active ? 'Desativar setor' : 'Ativar setor'}
        description={
          sectorToToggle
            ? sectorToToggle.active
              ? `Deseja realmente desativar o setor "${sectorToToggle.name}"? Ele não aparecerá na criação de novos chamados.`
              : `Deseja realmente ativar o setor "${sectorToToggle.name}"? Ele voltará a aparecer na criação de chamados.`
            : undefined
        }
        confirmLabel={sectorToToggle?.active ? 'Desativar' : 'Ativar'}
        isLoading={isToggling}
        onConfirm={() => void handleToggle()}
        onCancel={() => {
          setToggleOpen(false)
          setSectorToToggle(null)
        }}
      />
    </div>
  )
}
