import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-secondary/40 p-4 lg:p-6">
          <Outlet key={pathname} />
        </main>
      </div>
    </div>
  )
}
