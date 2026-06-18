import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isApiError } from '../../services/api'
import * as membershipService from '../../services/membershipService'
import * as sectorService from '../../services/sectorService'
import type { SectorMembership } from '../../types/membership.types'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { EditMembershipRoleModal } from './EditMembershipRoleModal'
import { PageHeader } from '../../components/layout/PageHeader'
import { sectorMembersBreadcrumbs } from '../../lib/breadcrumbs'

export function SectorMembersPage() {
  const { sectorId = '' } = useParams()
  const { showToast } = useToast()

  const [sectorName, setSectorName] = useState('')
  const [memberships, setMemberships] = useState<SectorMembership[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [selectedMembership, setSelectedMembership] = useState<SectorMembership | null>(null)

  const [removeOpen, setRemoveOpen] = useState(false)
  const [membershipToRemove, setMembershipToRemove] = useState<SectorMembership | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

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

  const loadMemberships = useCallback(async () => {
    if (!sectorId) return

    setIsLoading(true)

    try {
      const response = await membershipService.getMemberships(sectorId, {
        page,
        limit: 10,
        search: search || undefined,
      })

      setMemberships(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os membros do setor.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [sectorId, page, search, showToast])

  useEffect(() => {
    void loadSector()
  }, [loadSector])

  useEffect(() => {
    void loadMemberships()
  }, [loadMemberships])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function openEdit(membership: SectorMembership) {
    setSelectedMembership(membership)
    setEditOpen(true)
  }

  function openRemove(membership: SectorMembership) {
    setMembershipToRemove(membership)
    setRemoveOpen(true)
  }

  async function handleRemove() {
    if (!membershipToRemove || !sectorId) return

    setIsRemoving(true)

    try {
      await membershipService.removeMembership(sectorId, membershipToRemove.id)
      showToast('Usuário removido do setor com sucesso.', 'success')
      setRemoveOpen(false)
      setMembershipToRemove(null)
      void loadMemberships()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível remover o usuário do setor.')
      }
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={sectorMembersBreadcrumbs(sectorName)}
        icon={<Users size={20} />}
        title="Membros do setor"
        description={
          <>
            Vincule usuários ao setor com um cargo —{' '}
            <strong className="text-text">Gerente</strong> ou{' '}
            <strong className="text-text">Técnico</strong> — para definir suas permissões nos
            chamados.
          </>
        }
        actions={
          <Link
            to={`/setores/${sectorId}/membros/vincular`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
          >
            <Plus size={16} />
            Vincular usuário
          </Link>
        }
      />

      <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSearchSubmit}>
          <Input
            name="search"
            label="Pesquisar"
            placeholder="Nome, e-mail ou usuário"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
          <p className="text-sm text-text-muted">{total} membro(s) encontrado(s)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-text-muted lg:px-5">
            Nenhum usuário vinculado a este setor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/50 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium lg:px-5">Nome</th>
                  <th className="px-4 py-3 font-medium lg:px-5">E-mail</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Usuário</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Cargo</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Status</th>
                  <th className="px-4 py-3 text-right font-medium lg:px-5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => (
                  <tr key={membership.id} className="border-t border-border">
                    <td className="px-4 py-4 font-medium text-text lg:px-5">
                      {membership.user.firstName} {membership.user.lastName}
                    </td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">{membership.user.email}</td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">{membership.user.username}</td>
                    <td className="px-4 py-4 lg:px-5">
                      <Badge variant={membership.role.slug === 'MANAGER' ? 'primary' : 'neutral'}>
                        {membership.role.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <Badge variant={membership.user.isActive ? 'success' : 'warning'}>
                        {membership.user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(membership)}
                          aria-label={`Alterar cargo de ${membership.user.username}`}
                        >
                          <Pencil size={16} />
                          <span className="hidden sm:inline">Alterar cargo</span>
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => openRemove(membership)}
                          aria-label={`Remover ${membership.user.username} do setor`}
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Remover</span>
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

      <EditMembershipRoleModal
        open={editOpen}
        sectorId={sectorId}
        sectorName={sectorName}
        membership={selectedMembership}
        onClose={() => {
          setEditOpen(false)
          setSelectedMembership(null)
        }}
        onSuccess={() => void loadMemberships()}
      />

      <ConfirmDeleteModal
        open={removeOpen}
        title="Remover membro do setor"
        description={
          membershipToRemove
            ? `Deseja remover "${membershipToRemove.user.firstName} ${membershipToRemove.user.lastName}" do setor "${sectorName}"? O usuário perderá o acesso aos chamados deste setor.`
            : undefined
        }
        confirmLabel="Remover"
        isLoading={isRemoving}
        onConfirm={() => void handleRemove()}
        onCancel={() => {
          setRemoveOpen(false)
          setMembershipToRemove(null)
        }}
      />
    </div>
  )
}
