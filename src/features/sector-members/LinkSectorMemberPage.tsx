import { Search, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { isApiError } from '../../services/api'
import * as membershipService from '../../services/membershipService'
import * as roleService from '../../services/roleService'
import * as sectorService from '../../services/sectorService'
import type { Role } from '../../types/role.types'
import type { User } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { linkSectorMemberBreadcrumbs } from '../../lib/breadcrumbs'

export function LinkSectorMemberPage() {
  const { sectorId = '' } = useParams()
  const { showToast } = useToast()

  const [sectorName, setSectorName] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [roleByUserId, setRoleByUserId] = useState<Record<string, string>>({})
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null)

  const defaultRoleId = roles[0]?.id ?? ''

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

  const loadRoles = useCallback(async () => {
    try {
      const data = await roleService.getRoles()
      setRoles(data)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os cargos.')
      }
    }
  }, [showToast])

  const loadAvailableUsers = useCallback(async () => {
    if (!sectorId) return

    setIsLoading(true)

    try {
      const response = await sectorService.getAvailableUsers(sectorId, {
        page,
        limit: 10,
        search: search || undefined,
      })

      setUsers(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os usuários disponíveis.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [sectorId, page, search, showToast])

  useEffect(() => {
    void loadSector()
    void loadRoles()
  }, [loadSector, loadRoles])

  useEffect(() => {
    void loadAvailableUsers()
  }, [loadAvailableUsers])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function getRoleIdForUser(userId: string): string {
    return roleByUserId[userId] ?? defaultRoleId
  }

  function setRoleForUser(userId: string, roleId: string) {
    setRoleByUserId((current) => ({ ...current, [userId]: roleId }))
  }

  async function handleLink(user: User) {
    const roleId = getRoleIdForUser(user.id)
    if (!roleId) {
      showToast('Selecione um cargo antes de vincular.')
      return
    }

    setLinkingUserId(user.id)

    try {
      await membershipService.createMembership(sectorId, {
        userId: user.id,
        roleId,
      })
      showToast(
        `${user.firstName} ${user.lastName} vinculado ao setor com sucesso.`,
        'success',
      )
      void loadAvailableUsers()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível vincular o usuário ao setor.')
      }
    } finally {
      setLinkingUserId(null)
    }
  }

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={linkSectorMemberBreadcrumbs(sectorId, sectorName)}
        icon={<UserPlus size={20} />}
        title="Vincular usuário"
        description="Selecione o cargo e vincule usuários que ainda não fazem parte deste setor."
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
          <p className="text-sm text-text-muted">{total} usuário(s) disponível(is)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-text-muted lg:px-5">
            Nenhum usuário disponível para vincular a este setor.
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
                  <th className="px-4 py-3 text-right font-medium lg:px-5">Ação</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-4 py-4 font-medium text-text lg:px-5">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">{user.email}</td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">{user.username}</td>
                    <td className="px-4 py-4 lg:px-5">
                      <div className="min-w-[10rem]">
                        <Select
                          name={`role-${user.id}`}
                          label="Cargo"
                          hideLabel
                          value={getRoleIdForUser(user.id)}
                          onChange={(event) => setRoleForUser(user.id, event.target.value)}
                          options={roleOptions}
                          disabled={roles.length === 0 || linkingUserId === user.id}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => void handleLink(user)}
                          disabled={!defaultRoleId || linkingUserId === user.id}
                          aria-label={`Vincular ${user.username} ao setor`}
                        >
                          <UserPlus size={16} />
                          <span className="hidden sm:inline">
                            {linkingUserId === user.id ? 'Vinculando...' : 'Vincular'}
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
    </div>
  )
}
