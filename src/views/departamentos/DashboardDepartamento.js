import React from 'react';

/**
 * Dashboard de Departamento - Sistema EGIDE Django
 */
export default function DashboardDepartamento() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Dashboard - Departamento
          </h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-700">
              Bem-vindo ao Sistema EGIDE - Gestão de Operações
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Operações Ativas
              </h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Policiais Escalados
              </h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Equipes Formadas
              </h3>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
