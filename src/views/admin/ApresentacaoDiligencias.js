import React from 'react';

const ApresentacaoDiligencias = () => {
  // Dados de 2024
  const dados2024 = {
    mandadosPrisao: 621,
    mandadosBuscaApreensao: 1565,
    drogasKg: 19.62,
    veiculos: 42,
    valores: 630122.20,
    armas: 58
  };

  // Dados de 2025
  const dados2025 = {
    mandadosPrisao: 989,
    mandadosBuscaApreensao: 2236,
    drogasKg: 1834,
    veiculos: 128,
    valores: 5453116.60,
    armas: 77
  };

  // Calcular variação percentual
  const calcularVariacao = (valor2024, valor2025) => {
    const variacao = ((valor2025 - valor2024) / valor2024) * 100;
    return variacao.toFixed(1);
  };

  // Formatar valores
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarNumero = (valor) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  // Dados para os cards
  const indicadores = [
    {
      titulo: 'Mandados de Prisão',
      icone: '⚖️',
      valor2024: dados2024.mandadosPrisao,
      valor2025: dados2025.mandadosPrisao,
      unidade: 'mandados',
      cor: 'bg-blue-500'
    },
    {
      titulo: 'Mandados de Busca e Apreensão',
      icone: '🔍',
      valor2024: dados2024.mandadosBuscaApreensao,
      valor2025: dados2025.mandadosBuscaApreensao,
      unidade: 'mandados',
      cor: 'bg-purple-500'
    },
    {
      titulo: 'Drogas Apreendidas',
      icone: '💊',
      valor2024: dados2024.drogasKg,
      valor2025: dados2025.drogasKg,
      unidade: 'kg',
      cor: 'bg-red-500'
    },
    {
      titulo: 'Veículos Apreendidos',
      icone: '🚗',
      valor2024: dados2024.veiculos,
      valor2025: dados2025.veiculos,
      unidade: 'veículos',
      cor: 'bg-yellow-500'
    },
    {
      titulo: 'Valores Apreendidos',
      icone: '💰',
      valor2024: dados2024.valores,
      valor2025: dados2025.valores,
      unidade: 'reais',
      cor: 'bg-green-500',
      isMoeda: true
    },
    {
      titulo: 'Armas Apreendidas',
      icone: '🔫',
      valor2024: dados2024.armas,
      valor2025: dados2025.armas,
      unidade: 'armas',
      cor: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      {/* Cabeçalho */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          📊 RESULTADOS DAS DILIGÊNCIAS
        </h1>
        <p className="text-2xl text-gray-300">
          Comparativo de Desempenho: 2024 vs 2025
        </p>
        <div className="mt-4 flex justify-center gap-8 text-lg">
          <span className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold">
            Planejamento
          </span>
          <span className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold">
            Resultados
          </span>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {indicadores.map((indicador, index) => {
          const variacao = calcularVariacao(indicador.valor2024, indicador.valor2025);
          const isPositivo = parseFloat(variacao) > 0;
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-3xl"
            >
              {/* Cabeçalho do Card */}
              <div className={`${indicador.cor} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{indicador.icone}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isPositivo ? 'bg-green-400' : 'bg-red-400'
                  }`}>
                    {isPositivo ? '↑' : '↓'} {Math.abs(variacao)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-4">{indicador.titulo}</h3>
              </div>

              {/* Conteúdo do Card */}
              <div className="p-6 bg-gray-50">
                {/* Dados 2024 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-500 font-semibold mb-1">
                    2024 - Planejamento
                  </div>
                  <div className="text-2xl font-bold text-gray-700">
                    {indicador.isMoeda 
                      ? formatarMoeda(indicador.valor2024)
                      : formatarNumero(indicador.valor2024)
                    }
                  </div>
                  <div className="text-xs text-gray-400">{indicador.unidade}</div>
                </div>

                {/* Separador */}
                <div className="border-t-2 border-gray-200 my-3"></div>

                {/* Dados 2025 */}
                <div>
                  <div className="text-sm text-green-600 font-semibold mb-1">
                    2025 - Resultados
                  </div>
                  <div className="text-3xl font-bold text-green-700">
                    {indicador.isMoeda 
                      ? formatarMoeda(indicador.valor2025)
                      : formatarNumero(indicador.valor2025)
                    }
                  </div>
                  <div className="text-xs text-gray-400">{indicador.unidade}</div>
                </div>

                {/* Diferença absoluta */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Diferença:</div>
                  <div className={`text-lg font-bold ${isPositivo ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositivo ? '+' : ''}
                    {indicador.isMoeda 
                      ? formatarMoeda(indicador.valor2025 - indicador.valor2024)
                      : formatarNumero(indicador.valor2025 - indicador.valor2024)
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo Geral */}
      <div className="mt-12 max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          📈 Resumo Executivo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Totais 2024 */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-blue-800 mb-4">
              🎯 Planejamento 2024
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ {formatarNumero(dados2024.mandadosPrisao)} mandados de prisão</li>
              <li>✓ {formatarNumero(dados2024.mandadosBuscaApreensao)} mandados de busca</li>
              <li>✓ {formatarNumero(dados2024.drogasKg)} kg de drogas</li>
              <li>✓ {formatarNumero(dados2024.veiculos)} veículos</li>
              <li>✓ {formatarMoeda(dados2024.valores)} apreendidos</li>
              <li>✓ {formatarNumero(dados2024.armas)} armas</li>
            </ul>
          </div>

          {/* Totais 2025 */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">
              🏆 Resultados 2025
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ {formatarNumero(dados2025.mandadosPrisao)} mandados de prisão</li>
              <li>✓ {formatarNumero(dados2025.mandadosBuscaApreensao)} mandados de busca</li>
              <li>✓ {formatarNumero(dados2025.drogasKg)} kg de drogas</li>
              <li>✓ {formatarNumero(dados2025.veiculos)} veículos</li>
              <li>✓ {formatarMoeda(dados2025.valores)} apreendidos</li>
              <li>✓ {formatarNumero(dados2025.armas)} armas</li>
            </ul>
          </div>
        </div>

        {/* Conclusão */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">
            🎉 DESEMPENHO EXCEPCIONAL!
          </h3>
          <p className="text-lg">
            Crescimento médio de {calcularVariacao(
              (dados2024.mandadosPrisao + dados2024.mandadosBuscaApreensao) / 2,
              (dados2025.mandadosPrisao + dados2025.mandadosBuscaApreensao) / 2
            )}% nas operações realizadas
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center mt-12 text-gray-400 text-sm">
        Sistema EGIDE - Gestão de Operações Policiais
        <br />
        Dados atualizados em: {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
};

export default ApresentacaoDiligencias;
