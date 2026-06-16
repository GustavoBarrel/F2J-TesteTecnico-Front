import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
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

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  function openDelete(user: User) {
    setUserToDelete(user)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!userToDelete) return

    setIsDeleting(true)

    try {
      await userService.deactivateUser(userToDelete.id)
      showToast('Usuário desativado com sucesso.', 'success')
      setDeleteOpen(false)
      setUserToDelete(null)
      void loadUsers()
    } catch (error) {
      if (isApiError(error)) {
        showToast(error.message)
      } else {
        showToast('Não foi possível desativar o usuário.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Usuários</h2>
          <p className="mt-1 text-sm text-text-muted">
            Gerencie os usuários da central de serviços
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Criar usuário
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
                          variant="danger"
                          onClick={() => openDelete(user)}
                          disabled={!user.isActive}
                          aria-label={`Desativar ${user.username}`}
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Desativar</span>
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
        open={deleteOpen}
        title="Desativar usuário"
        description={
          userToDelete
            ? `Deseja realmente desativar o usuário "${userToDelete.firstName} ${userToDelete.lastName}"? Ele não poderá mais acessar o sistema.`
            : undefined
        }
        confirmLabel="Desativar"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          setDeleteOpen(false)
          setUserToDelete(null)
        }}
      />
    </div>
  )
}
