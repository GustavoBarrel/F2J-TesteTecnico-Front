import { Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '../../components/ui/Input'
import { isApiError } from '../../services/api'
import * as requestService from '../../services/requestService'
import { useToast } from '../../contexts/ToastContext'
import type { ObserverOption } from '../../types/request.types'

interface ObserverPickerProps {
  value: string[]
  onChange: (ids: string[]) => void
  knownUsers?: ObserverOption[]
}

export function ObserverPicker({ value, onChange, knownUsers = [] }: ObserverPickerProps) {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<ObserverOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userCache, setUserCache] = useState<Map<string, ObserverOption>>(
    () => new Map(knownUsers.map((u) => [u.id, u])),
  )

  const selected = useMemo(() => new Set(value), [value])

  useEffect(() => {
    setUserCache((prev) => {
      const next = new Map(prev)
      for (const user of knownUsers) next.set(user.id, user)
      return next
    })
  }, [knownUsers])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      requestService
        .getObserverOptions(search.trim() || undefined)
        .then((users) => {
          setOptions(users)
          setUserCache((prev) => {
            const next = new Map(prev)
            for (const user of users) next.set(user.id, user)
            return next
          })
        })
        .catch((err) => {
          if (isApiError(err)) showToast(err.message)
        })
        .finally(() => setIsLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [search, showToast])

  const displayUsers = useMemo(() => {
    const map = new Map<string, ObserverOption>()
    for (const id of value) {
      const cached = userCache.get(id)
      if (cached) map.set(id, cached)
    }
    for (const user of options) map.set(user.id, user)
    return Array.from(map.values()).sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'pt-BR'),
    )
  }, [value, userCache, options])

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(Array.from(next))
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <Users size={16} className="text-text-muted" />
          Observadores
        </label>
        <p className="mt-1 text-xs text-text-muted">
          Opcional. Qualquer usuário ativo pode acompanhar a solicitação.
        </p>
      </div>

      <Input
        label="Buscar usuário"
        name="observerSearch"
        placeholder="Nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Carregando usuários...</p>
      ) : displayUsers.length === 0 ? (
        <p className="text-sm text-text-muted">Nenhum usuário encontrado.</p>
      ) : (
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
          {displayUsers.map((user) => (
            <label
              key={user.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-secondary"
            >
              <input
                type="checkbox"
                checked={selected.has(user.id)}
                onChange={() => toggle(user.id)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-text">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {value.length > 0 ? (
        <p className="text-xs text-text-muted">
          {value.length}{' '}
          {value.length === 1 ? 'observador selecionado' : 'observadores selecionados'}
        </p>
      ) : null}
    </div>
  )
}
