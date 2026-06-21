import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { HomePage } from './features/home/HomePage'
import { UsersPage } from './features/users/UsersPage'
import { SectorsPage } from './features/sectors/SectorsPage'
import { SectorMembersPage } from './features/sector-members/SectorMembersPage'
import { LinkSectorMemberPage } from './features/sector-members/LinkSectorMemberPage'
import { SectorServicesPage } from './features/sector-services/SectorServicesPage'
import { MyRequestsPage } from './features/requests/MyRequestsPage'
import { AssignedRequestsPage } from './features/requests/AssignedRequestsPage'
import { NewRequestPage } from './features/requests/NewRequestPage'
import { SectorRequestsPage } from './features/requests/SectorRequestsPage'
import { RequestDetailPage } from './features/requests/RequestDetailPage'
import { RequestAutoCompleteSettingsPage } from './features/settings/RequestAutoCompleteSettingsPage'

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          {
            path: '/usuarios',
            element: (
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            ),
          },
          {
            path: '/setores',
            element: (
              <AdminRoute>
                <SectorsPage />
              </AdminRoute>
            ),
          },
          {
            path: '/setores/:sectorId/servicos',
            element: (
              <AdminRoute>
                <SectorServicesPage />
              </AdminRoute>
            ),
          },
          {
            path: '/setores/:sectorId/membros',
            element: (
              <AdminRoute>
                <SectorMembersPage />
              </AdminRoute>
            ),
          },
          {
            path: '/setores/:sectorId/membros/vincular',
            element: (
              <AdminRoute>
                <LinkSectorMemberPage />
              </AdminRoute>
            ),
          },
          {
            path: '/configuracoes/auto-conclusao',
            element: (
              <AdminRoute>
                <RequestAutoCompleteSettingsPage />
              </AdminRoute>
            ),
          },
          {
            path: '/solicitacoes',
            children: [
              { index: true, element: <Navigate to="/" replace /> },
              { path: 'nova', element: <NewRequestPage /> },
              { path: 'minhas', element: <MyRequestsPage /> },
              { path: 'atribuidas', element: <AssignedRequestsPage /> },
              { path: 'setores/:sectorId', element: <SectorRequestsPage /> },
              { path: ':requestId', element: <RequestDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
