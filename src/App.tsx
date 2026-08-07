import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { StoreProvider } from '@/store/StoreContext';
import { ToastProvider } from '@/store/ToastContext';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/components/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { OwnersPage } from '@/pages/OwnersPage';
import { OwnerDetailPage } from '@/pages/OwnerDetailPage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { OccurrencesPage } from '@/pages/OccurrencesPage';
import { OccurrenceDetailPage } from '@/pages/OccurrenceDetailPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { ImportPage } from '@/pages/ImportPage';
import { AdminPage } from '@/pages/AdminPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { Loader2 } from 'lucide-react';

function ProtectedRoutes() {
  const { user, loading, isPlatformAdmin } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/proprietarios" element={<OwnersPage />} />
          <Route path="/proprietarios/:id" element={<OwnerDetailPage />} />
          <Route path="/inquilinos" element={<TenantsPage />} />
          <Route path="/imoveis" element={<PropertiesPage />} />
          <Route path="/imoveis/:id" element={<PropertyDetailPage />} />
          <Route path="/ocorrencias" element={<OccurrencesPage />} />
          <Route path="/ocorrencias/:id" element={<OccurrenceDetailPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/admin" element={isPlatformAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/convite/:token" element={<AcceptInvitePage />} />
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StoreProvider>
          <ProtectedRoutes />
        </StoreProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
