import { Building2, Home, LogOut, Menu, Moon, Sun, Timer, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'

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
            {
              to: '/configuracoes/auto-conclusao',
              label: 'Auto-conclusão',
              icon: Timer,
              end: false,
            },
          ]
        : []),
    ],
    [user?.isGlobalAdmin],
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg bg-sidebar p-2 text-white xl:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 xl:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={[
          'relative z-30 flex w-52 shrink-0 flex-col bg-sidebar text-white',
          'max-xl:fixed max-xl:inset-y-0 max-xl:left-0 max-xl:z-50 max-xl:w-56 max-xl:max-w-[72vw] max-xl:shadow-xl max-xl:transition-transform',
          open
            ? 'max-xl:translate-x-0 max-xl:pointer-events-auto'
            : 'max-xl:pointer-events-none max-xl:-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-4 xl:px-4 xl:py-5">
          <div className="min-w-0 flex-1">
            <Logo className="mx-auto w-full" />
          </div>
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-white/10 xl:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3 xl:gap-1 xl:p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors xl:gap-3 xl:px-3 xl:py-2.5',
                  isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 xl:hidden">
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
