import React, { useMemo } from 'react';
import planoCarnavalData from '../../data/planoCarnaval2026.json';

const MapaCarnaval2026 = () => {
  // Cores por departamento
  const coresDepartamento = {
    'DPI NORTE': '#3b82f6', // azul
    'DPI SUL': '#10b981', // verde
    'DPM': '#f59e0b', // amarelo
    'DHPP': '#ef4444', // vermelho
    'DPE': '#8b5cf6', // roxo
    'COPLAN': '#ec4899', // rosa
    'DPGV': '#14b8a6', // teal
    'DRCO': '#f97316', // laranja
    'DTO': '#6366f1', // indigo
    'CORE': '#84cc16' // lime
  };

  // Bounds do mapa do Ceará
  const bounds = {
    minLat: -7.9,
    maxLat: -2.7,
    minLng: -41.5,
    maxLng: -37.2
  };

  // Função para converter coordenadas geográficas para posição no SVG
  const coordToSVG = (lat, lng, width = 1000, height = 800) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
  };

  // Agrupar delegacias por departamento para legenda
  const delegaciasPorDepartamento = useMemo(() => {
    return planoCarnavalData.delegacias.reduce((acc, delegacia) => {
      if (!acc[delegacia.departamento]) {
        acc[delegacia.departamento] = [];
      }
      acc[delegacia.departamento].push(delegacia);
      return acc;
    }, {});
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Mapa das Delegacias - Carnaval 2026
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mapa */}
        <div className="flex-1">
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <svg 
              viewBox="0 0 1000 800" 
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            >
              {/* Título do mapa */}
              <text x="500" y="30" textAnchor="middle" className="text-2xl font-bold" fill="#1f2937">
                Estado do Ceará
              </text>

              {/* Contorno simplificado do Ceará */}
              <path
                d="M 150,50 L 850,50 L 900,150 L 950,400 L 900,650 L 700,750 L 400,750 L 200,700 L 100,500 L 100,200 Z"
                fill="#e5e7eb"
                stroke="#9ca3af"
                strokeWidth="2"
              />

              {/* Marcadores das delegacias */}
              {planoCarnavalData.delegacias.map((delegacia) => {
                const pos = coordToSVG(delegacia.coordenadas.lat, delegacia.coordenadas.lng);
                const cor = coresDepartamento[delegacia.departamento] || '#6b7280';
                const raio = delegacia.tipoPlantao === 'EXTRAORDINÁRIO' ? 8 : 6;

                return (
                  <g key={delegacia.id}>
                    {/* Círculo do marcador */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={raio}
                      fill={cor}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <title>
                        {delegacia.nome} - {delegacia.departamento}
                        {'\n'}Tipo: {delegacia.tipoPlantao}
                        {'\n'}Horário: {delegacia.horario}
                        {'\n'}Efetivo: {delegacia.efetivoPlanejado}
                      </title>
                    </circle>

                    {/* Pulse animation para extraordinários */}
                    {delegacia.tipoPlantao === 'EXTRAORDINÁRIO' && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={raio}
                        fill={cor}
                        opacity="0.3"
                      >
                        <animate
                          attributeName="r"
                          from={raio}
                          to={raio + 6}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.3"
                          to="0"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Fortaleza - Destaque especial */}
              <g>
                <circle cx="750" cy="300" r="12" fill="#dc2626" stroke="white" strokeWidth="3" />
                <text x="750" y="330" textAnchor="middle" className="text-sm font-bold" fill="#dc2626">
                  Fortaleza
                </text>
              </g>
            </svg>
          </div>
          
          {/* Legenda do mapa */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Legenda</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-600">Ordinário</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-400 animate-pulse"></div>
                <span className="text-xs text-gray-600">Extraordinário</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda lateral - Departamentos */}
        <div className="lg:w-80">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Departamentos</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {Object.entries(delegaciasPorDepartamento)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([departamento, delegacias]) => (
                  <div key={departamento} className="border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: coresDepartamento[departamento] }}
                      ></div>
                      <span className="text-sm font-semibold text-gray-700">
                        {departamento}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({delegacias.length})
                      </span>
                    </div>
                    <div className="ml-5 text-xs text-gray-600">
                      {delegacias.slice(0, 3).map(d => d.nome).join(', ')}
                      {delegacias.length > 3 && ` e mais ${delegacias.length - 3}...`}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Estatísticas Rápidas
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Total de Delegacias:</span>
                <span className="font-semibold text-blue-900">
                  {planoCarnavalData.delegacias.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Ordinárias:</span>
                <span className="font-semibold text-blue-900">
                  {planoCarnavalData.delegacias.filter(d => d.tipoPlantao === 'ORDINÁRIO').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Extraordinárias:</span>
                <span className="font-semibold text-blue-900">
                  {planoCarnavalData.delegacias.filter(d => d.tipoPlantao === 'EXTRAORDINÁRIO').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Departamentos:</span>
                <span className="font-semibold text-blue-900">
                  {Object.keys(delegaciasPorDepartamento).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Observações Importantes</h4>
        <ul className="text-sm text-yellow-900 space-y-1">
          <li>• Delegacias com animação pulsante são plantões extraordinários</li>
          <li>• Cores representam os diferentes departamentos</li>
          <li>• Passe o mouse sobre os marcadores para ver detalhes</li>
          <li>• Algumas delegacias dependem de aporte financeiro para abertura</li>
        </ul>
      </div>
    </div>
  );
};

export default MapaCarnaval2026;
