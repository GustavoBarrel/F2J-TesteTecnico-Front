import { Pencil, Plus, PowerOff, Search, Users, Zap } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { isApiError } from '../../services/api'
import * as userService from '../../services/userService'
import type { User } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { UserFormModal } from './UserFormModal'
import { PageHeader } from '../../components/layout/PageHeader'
import { usersBreadcrumbs } from '../../lib/breadcrumbs'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function UsersPage() {
  const { showToast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [toggleOpen, setToggleOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await userService.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        isActive:
          statusFilter === 'all' ? undefined : statusFilter === 'active',
      })

      setUsers(response.data)
      setTotalPages(response.meta.totalPages)
      setTotal(response.meta.total)
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível carregar os usuários.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, showToast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function openCreate() {
    setFormMode('create')
    setSelectedUser(null)
    setFormOpen(true)
  }

  function openEdit(user: User) {
    setFormMode('edit')
    setSelectedUser(user)
    setFormOpen(true)
  }

  function openToggle(user: User) {
    setUserToToggle(user)
    setToggleOpen(true)
  }

  async function handleToggle() {
    if (!userToToggle) return

    setIsToggling(true)

    try {
      await userService.toggleUserActive(userToToggle.id)
      const action = userToToggle.isActive ? 'desativado' : 'ativado'
      showToast(`Usuário ${action} com sucesso.`, 'success')
      setToggleOpen(false)
      setUserToToggle(null)
      void loadUsers()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível alterar o status do usuário.')
      }
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={usersBreadcrumbs}
        icon={<Users size={20} />}
        title="Usuários"
        description="Gerencie os usuários da central de serviços"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Criar usuário
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
            placeholder="Nome, e-mail ou usuário"
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
          <p className="text-sm text-text-muted">{total} usuário(s) encontrado(s)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-text-muted lg:px-5">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/50 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium lg:px-5">Nome</th>
                  <th className="px-4 py-3 font-medium lg:px-5">E-mail</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Usuário</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Perfil</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Status</th>
                  <th className="px-4 py-3 font-medium lg:px-5">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium lg:px-5">Ações</th>
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
                      {user.isGlobalAdmin ? (
                        <Badge variant="primary">Admin</Badge>
                      ) : (
                        <Badge>Usuário</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <Badge variant={user.isActive ? 'success' : 'warning'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-text-muted lg:px-5">
                      {dateFormatter.format(new Date(user.createdAt))}
                    </td>
                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(user)}
                          aria-label={`Editar ${user.username}`}
                        >
                          <Pencil size={16} />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant={user.isActive ? 'danger' : 'secondary'}
                          onClick={() => openToggle(user)}
                          aria-label={`${user.isActive ? 'Desativar' : 'Ativar'} ${user.username}`}
                        >
                          {user.isActive ? <PowerOff size={16} /> : <Zap size={16} />}
                          <span className="hidden sm:inline">
                            {user.isActive ? 'Desativar' : 'Ativar'}
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

      <UserFormModal
        open={formOpen}
        mode={formMode}
        user={selectedUser}
        onClose={() => setFormOpen(false)}
        onSuccess={() => void loadUsers()}
      />

      <ConfirmDeleteModal
        open={toggleOpen}
        title={userToToggle?.isActive ? 'Desativar usuário' : 'Ativar usuário'}
        description={
          userToToggle
            ? userToToggle.isActive
              ? `Deseja realmente desativar o usuário "${userToToggle.firstName} ${userToToggle.lastName}"? Ele não poderá mais acessar o sistema.`
              : `Deseja realmente ativar o usuário "${userToToggle.firstName} ${userToToggle.lastName}"? Ele voltará a ter acesso ao sistema.`
            : undefined
        }
        confirmLabel={userToToggle?.isActive ? 'Desativar' : 'Ativar'}
        isLoading={isToggling}
        onConfirm={() => void handleToggle()}
        onCancel={() => {
          setToggleOpen(false)
          setUserToToggle(null)
        }}
      />
    </div>
  )
}
