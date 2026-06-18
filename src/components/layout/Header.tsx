import { LogOut, Moon, Shield, Sun } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { Button } from '../ui/Button'

export function Header() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 xl:px-6 xl:py-4">
      <div className="min-w-0 pl-12 xl:pl-0">
        <h1 className="truncate text-base font-semibold text-primary xl:text-lg">Central de Serviços</h1>
        <p className="hidden truncate text-sm text-text-muted sm:block">Gerencie solicitações entre setores</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 xl:gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-secondary hover:text-text"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden items-center gap-4 xl:flex">
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
      </div>
    </header>
  )
}
