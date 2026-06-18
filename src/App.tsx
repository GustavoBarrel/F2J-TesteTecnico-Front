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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/setores" element={<SectorsPage />} />
              <Route path="/setores/:sectorId/servicos" element={<SectorServicesPage />} />
              <Route path="/setores/:sectorId/membros" element={<SectorMembersPage />} />
              <Route path="/setores/:sectorId/membros/vincular" element={<LinkSectorMemberPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
