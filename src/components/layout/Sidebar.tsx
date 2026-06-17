import { Building2, Home, LogOut, Menu, Moon, Sun, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { Button } from '../ui/Button'
import { LogoPlaceholder } from '../ui/LogoPlaceholder'

export function Sidebar() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const [open, setOpen] = useState(false)

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Início', icon: Home, end: true },
      ...(user?.isGlobalAdmin
        ? [
            { to: '/usuarios', label: 'Usuários', icon: Users, end: false },
            { to: '/setores', label: 'Setores', icon: Building2, end: false },
          ]
        : []),
    ],
    [user?.isGlobalAdmin],
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg bg-sidebar p-2 text-white lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <LogoPlaceholder className="h-10 w-10" />
            <div className="text-left">
              <p className="text-sm font-semibold">ServiceHub</p>
              <p className="text-xs text-white/70">Central de Serviços</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 lg:hidden">
          <p className="mb-1 text-sm font-medium">{user?.username}</p>
          <p className="mb-3 text-xs text-white/70">{user?.email}</p>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" fullWidth className="text-white hover:bg-white/10" onClick={toggle}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Modo claro' : 'Modo escuro'}
            </Button>
            <Button variant="ghost" fullWidth className="text-white hover:bg-white/10" onClick={logout}>
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
