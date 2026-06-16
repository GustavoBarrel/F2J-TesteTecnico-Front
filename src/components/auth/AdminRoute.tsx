import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function AdminRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
      </div>
    )
  }

  if (!user?.isGlobalAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
