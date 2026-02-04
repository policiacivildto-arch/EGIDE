import React from 'react';
import ApresentacaoCarnaval2026 from './ApresentacaoCarnaval2026';
import MapaCarnaval2026 from './MapaCarnaval2026';
import DashboardCarnaval2026 from './DashboardCarnaval2026';

const PlanoOperacionalCarnaval = () => {
  const [abaAtiva, setAbaAtiva] = React.useState('apresentacao');

  const abas = [
    { id: 'apresentacao', nome: 'Apresentação', icone: '📊' },
    { id: 'mapa', nome: 'Mapa Interativo', icone: '🗺️' },
    { id: 'dashboard', nome: 'Dashboard', icone: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navegação por abas */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8 border-b">
            {abas.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`py-4 px-6 font-medium text-sm transition-colors border-b-2 ${
                  abaAtiva === aba.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{aba.icone}</span>
                {aba.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {abaAtiva === 'apresentacao' && <ApresentacaoCarnaval2026 />}
        {abaAtiva === 'mapa' && <MapaCarnaval2026 />}
        {abaAtiva === 'dashboard' && <DashboardCarnaval2026 />}
      </div>
    </div>
  );
};

export default PlanoOperacionalCarnaval;
