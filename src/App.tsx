import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage   from '@/pages/DashboardPage';
import IncomePage       from '@/pages/IncomePage';
import ExpensesPage     from '@/pages/ExpensesPage';
import InstallmentsPage from '@/pages/InstallmentsPage';
import SharedPage       from '@/pages/SharedPage';
import ChartPage        from '@/pages/ChartPage';
import ForecastPage     from '@/pages/ForecastPage';
import SettingsPage     from '@/pages/Settings';
import { DataProvider } from '@/context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<DashboardPage />} />
          <Route path="/income"       element={<IncomePage />} />
          <Route path="/expenses"     element={<ExpensesPage />} />
          <Route path="/installments" element={<InstallmentsPage />} />
          <Route path="/shared"       element={<SharedPage />} />
          <Route path="/chart"        element={<ChartPage />} />
          <Route path="/forecast"     element={<ForecastPage />} />
          <Route path="/settings"    element={<SettingsPage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
