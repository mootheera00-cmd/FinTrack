import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard    from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Recurring    from '@/pages/Recurring';
import Cards        from '@/pages/Cards';
import Settings     from '@/pages/Settings';
import AuthPage     from '@/pages/AuthPage';
import { useAuth }  from '@/hooks/useAuth';
import { DataProvider } from '@/context/DataContext';

function AppRoutes() {
  const { session, loading } = useAuth();

  // Show blank screen while checking session (avoids flash of wrong page)
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → show Auth page for all routes
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  // Logged in → show main app
  return (
    <Routes>
      <Route path="/"             element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/recurring"    element={<Recurring />} />
      <Route path="/cards"        element={<Cards />} />
      <Route path="/settings"     element={<Settings />} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DataProvider>
  );
}
