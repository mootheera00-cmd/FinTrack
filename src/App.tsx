import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import IncomePage       from '@/pages/IncomePage';
import ExpensesPage     from '@/pages/ExpensesPage';
import InstallmentsPage from '@/pages/InstallmentsPage';
import SharedPage       from '@/pages/SharedPage';
import ChartPage        from '@/pages/ChartPage';
import ForecastPage     from '@/pages/ForecastPage';
import AuthPage         from '@/pages/AuthPage';
import { useAuth }      from '@/hooks/useAuth';
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
      <Route path="/"            element={<IncomePage />} />
      <Route path="/expenses"    element={<ExpensesPage />} />
      <Route path="/installments" element={<InstallmentsPage />} />
      <Route path="/shared"      element={<SharedPage />} />
      <Route path="/chart"       element={<ChartPage />} />
      <Route path="/forecast"    element={<ForecastPage />} />
      <Route path="*"            element={<Navigate to="/" replace />} />
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
