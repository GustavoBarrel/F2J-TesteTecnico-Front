import { LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-4 lg:px-6">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-lg font-semibold text-primary">Central de Serviços</h1>
        <p className="text-sm text-text-muted">Gerencie solicitações entre setores</p>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <div className="text-right">
          <p className="text-sm font-medium text-text">{user?.username}</p>
          <p className="text-xs text-text-muted">{user?.email}</p>
        </div>
        {user?.isGlobalAdmin ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
            <Shield size={14} />
            Admin
          </span>
        ) : null}
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </header>
  )
}
