/**
 * Componente de Rota Protegida - Sistema Django
 * Protege rotas que requerem autenticação
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useDjangoAuth';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar role se necessário
  if (requiredRole) {
    const hasRole = user?.is_superuser || 
                    (requiredRole === 'staff' && user?.is_staff);
    
    if (!hasRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-700">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
