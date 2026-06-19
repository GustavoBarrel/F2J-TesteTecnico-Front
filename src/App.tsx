import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="usuarios"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="setores"
              element={
                <AdminRoute>
                  <SectorsPage />
                </AdminRoute>
              }
            />
            <Route
              path="setores/:sectorId/servicos"
              element={
                <AdminRoute>
                  <SectorServicesPage />
                </AdminRoute>
              }
            />
            <Route
              path="setores/:sectorId/membros"
              element={
                <AdminRoute>
                  <SectorMembersPage />
                </AdminRoute>
              }
            />
            <Route
              path="setores/:sectorId/membros/vincular"
              element={
                <AdminRoute>
                  <LinkSectorMemberPage />
                </AdminRoute>
              }
            />
            <Route path="solicitacoes" element={<Navigate to="/" replace />} />
            <Route path="solicitacoes/nova" element={<NewRequestPage />} />
            <Route path="solicitacoes/minhas" element={<MyRequestsPage />} />
            <Route path="solicitacoes/atribuidas" element={<AssignedRequestsPage />} />
            <Route path="solicitacoes/setores/:sectorId" element={<SectorRequestsPage />} />
            <Route path="solicitacoes/:id" element={<RequestDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
