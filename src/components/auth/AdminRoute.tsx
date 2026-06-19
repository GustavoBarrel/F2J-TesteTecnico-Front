import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
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

  return <>{children}</>
}
