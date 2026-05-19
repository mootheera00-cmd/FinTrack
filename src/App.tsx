import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard    from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Cards        from '@/pages/Cards';
import Settings     from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/cards"        element={<Cards />} />
        <Route path="/settings"     element={<Settings />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
