/**
 * App Principal - Sistema EGIDE Django
 * Versão integrada com backend Django
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useDjangoAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Páginas
import LoginPage from './views/auth/LoginPage';
import DashboardDepartamento from './views/departamentos/DashboardDepartamento';

// Loading Component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      <p className="mt-4 text-xl font-semibold text-gray-700">
        Carregando Sistema EGIDE...
      </p>
    </div>
  </div>
);

// App Router (dentro do AuthProvider)
function AppRouter() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Rota de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardDepartamento />
            </ProtectedRoute>
          }
        />

        {/* Redirecionar root para dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600">Página não encontrada</p>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

// App Principal
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
