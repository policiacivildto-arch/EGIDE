// RelatorioView.js - Componente de Relatório de Operações em Tempo Real
import React from 'react';
import { FileText, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Users, Plus } from 'lucide-react';

export function RelatorioView({ 
    operations, 
    equipes, 
    isPolicialOperacional,
    equipesDoPolicialAtual,
    selectedOperationRelatorio, 
    setSelectedOperationRelatorio,
    policiaisPresenca,
    setPoliciaisPresenca,
    showNotification,
    setShowSubstituicaoModal,
    setShowResultadosModal,
    resultadosOperacao,
    setEquipes,
    userData
}) {
    // Filtrar operações baseado no perfil
    let operacoesParaRelatorio = operations.filter(op => 
        op.status === 'Aprovada pelo DTO' || op.status === 'Em Execução'
    );
    
    // Policial só vê operações das suas equipes
    if (isPolicialOperacional) {
        operacoesParaRelatorio = operacoesParaRelatorio.filter(op =>
            equipesDoPolicialAtual.some(eq => eq.operacaoId === op.id)
        );
    }

    const handleMarcarPresenca = (operacaoId, equipeId, policial) => {
        const key = `${operacaoId}-${equipeId}-${policial}`;
        const novaPresenca = { ...policiaisPresenca };
        novaPresenca[key] = !novaPresenca[key];
        setPoliciaisPresenca(novaPresenca);

        if (novaPresenca[key]) {
            novaPresenca[`${operacaoId}-${equipeId}-status`] = 'chegou';
            showNotification('Presença confirmada! Equipe marcada como chegada.', 'success');
        }
        setPoliciaisPresenca(novaPresenca);
    };

    const handleMarcarEquipeChegou = (operacaoId, equipeId) => {
        const key = `${operacaoId}-${equipeId}-status`;
        const novaPresenca = { ...policiaisPresenca };
        const marcando = novaPresenca[key] !== 'chegou';
        novaPresenca[key] = marcando ? 'chegou' : null;
        
        const equipe = equipes.find(eq => eq.id === equipeId);
        if (equipe) {
            if (equipe.chefe) {
                novaPresenca[`${operacaoId}-${equipeId}-${equipe.chefe}`] = marcando;
            }
            if (equipe.membros) {
                equipe.membros.forEach(membro => {
                    novaPresenca[`${operacaoId}-${equipeId}-${membro}`] = marcando;
                });
            }
        }
        
        setPoliciaisPresenca(novaPresenca);
        showNotification(
            marcando ? 'Equipe e todos os policiais marcados como chegados!' : 'Equipe desmarcada',
            'success'
        );
    };

    const getEquipesFaltam = (operacaoId) => {
        return equipes.filter(eq => !policiaisPresenca[`${operacaoId}-${eq.id}-status`]);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                    <FileText className="text-cyan-400" size={28} />
                    <span>Relatório de Operações - Tempo Real</span>
                </h2>
                <p className="text-gray-400 mb-6">Controle de presença e registro de resultados em tempo real</p>

                {operacoesParaRelatorio.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhuma operação em andamento</p>
                    </div>
                ) : !selectedOperationRelatorio ? (
                    /* Seleção de Operação */
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Selecione uma Operação:</h3>
                        {operacoesParaRelatorio.map(operacao => {
                            const equipesOperacao = equipes.filter(eq => eq.operacaoId === operacao.id);
                            const equipesNaoChegaram = getEquipesFaltam(operacao.id);
                            const temResultados = resultadosOperacao[operacao.id];
                            
                            return (
                                <div 
                                    key={operacao.id} 
                                    onClick={() => setSelectedOperationRelatorio(operacao.id)}
                                    className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-5 cursor-pointer hover:from-cyan-900 hover:to-cyan-800 transition-all border-l-4 border-cyan-500"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                Operação: {operacao.titulo || operacao.nome}
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                {operacao.departamento_solicitante_sigla || operacao.departamento} | {new Date(operacao.data_hora_inicio).toLocaleDateString('pt-BR')}
                                            </p>
                                            <div className="flex items-center space-x-3 mt-3">
                                                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                                                    operacao.status === 'Em Execução' 
                                                        ? 'bg-green-600 text-white' 
                                                        : 'bg-blue-600 text-white'
                                                }`}>
                                                    {operacao.status}
                                                </span>
                                                <span className="text-sm text-gray-300">
                                                    📋 {equipesOperacao.length} equipe(s) cadastrada(s)
                                                </span>
                                                {equipesNaoChegaram.length > 0 && (
                                                    <span className="bg-yellow-600 px-2 py-1 rounded text-xs">
                                                        ⚠️ {equipesNaoChegaram.length} pendente(s)
                                                    </span>
                                                )}
                                                {temResultados && (
                                                    <span className="bg-green-600 px-2 py-1 rounded text-xs flex items-center space-x-1">
                                                        <CheckCircle size={14} />
                                                        <span>Resultados Registrados</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-cyan-400">
                                            <ArrowRight size={32} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Detalhes da operação selecionada */
                    (() => {
                        const operacao = operacoesParaRelatorio.find(op => op.id === selectedOperationRelatorio);
                        if (!operacao) return null;
                        
                        // Filtrar equipes baseado no perfil
                        let equipesOperacao = equipes.filter(eq => eq.operacaoId === operacao.id);
                        if (isPolicialOperacional) {
                            equipesOperacao = equipesOperacao.filter(eq =>
                                eq.chefe === userData?.nome || 
                                (eq.membros && eq.membros.includes(userData?.nome))
                            );
                        }
                        
                        const equipesNaoChegaram = getEquipesFaltam(operacao.id);
                        
                        return (
                            <div>
                                {/* Cabeçalho da Operação */}
                                <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 rounded-lg p-6 mb-6">
                                    <button
                                        onClick={() => setSelectedOperationRelatorio(null)}
                                        className="mb-4 text-cyan-200 hover:text-white flex items-center space-x-2"
                                    >
                                        <ArrowLeft size={20} />
                                        <span>Voltar para lista de operações</span>
                                    </button>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{operacao.nome}</h3>
                                            <p className="text-cyan-100">
                                                {operacao.departamento_solicitante_sigla} - {new Date(operacao.data_hora_inicio).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => setShowResultadosModal(true)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-semibold"
                                            >
                                                <CheckCircle size={20} />
                                                <span>Registrar Resultados</span>
                                            </button>
                                            <span className={`px-4 py-2 rounded font-semibold ${
                                                operacao.status === 'Em Execução' 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-blue-600 text-white'
                                            }`}>
                                                {operacao.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Resultados da Operação em Tempo Real */}
                                {resultadosOperacao[selectedOperationRelatorio] && (
                                    <div className="bg-green-900/30 border border-green-600 rounded-lg p-6 mb-6">
                                        <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center space-x-2">
                                            <CheckCircle size={24} />
                                            <span>Resultados Registrados em Tempo Real</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">MP Cumpridos</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].mpCumpridos}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">MP Diligenciados</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].mpDiligenciados}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Flagrante</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].flagrante}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Busca Cumpridos</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].buscaCumpridos}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">MBA Diligenciados</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].mbaDiligenciados}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Celulares</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].qtdCelular}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Veículos</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].qtdVeiculo}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Munições</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].qtdMunicoes}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Armas</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].qtdArma}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Dinheiro</div>
                                                <div className="text-2xl font-bold text-green-400">
                                                    R$ {resultadosOperacao[selectedOperationRelatorio].dinheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Medidas Cautelares</div>
                                                <div className="text-2xl font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].medidasCautelares}</div>
                                            </div>
                                            <div className="bg-gray-800 p-3 rounded">
                                                <div className="text-sm text-gray-400">Droga</div>
                                                <div className="text-lg font-bold text-white">{resultadosOperacao[selectedOperationRelatorio].droga || 'N/A'}</div>
                                            </div>
                                        </div>
                                        {resultadosOperacao[selectedOperationRelatorio].observacoes && (
                                            <div className="mt-4 bg-gray-800 p-4 rounded">
                                                <div className="text-sm text-gray-400 mb-2">Observações</div>
                                                <div className="text-white">{resultadosOperacao[selectedOperationRelatorio].observacoes}</div>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setShowResultadosModal(true)}
                                            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
                                        >
                                            Atualizar Resultados
                                        </button>
                                    </div>
                                )}

                                {/* Alerta de Equipes Faltando */}
                                {equipesNaoChegaram.length > 0 && (
                                    <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <AlertCircle className="text-yellow-400" size={20} />
                                            <h4 className="font-semibold text-yellow-400">
                                                {equipesNaoChegaram.length} Equipe(s) Não Chegaram
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {equipesNaoChegaram.map(eq => (
                                                <div key={eq.id} className="text-sm text-yellow-200">
                                                    • {eq.departamento} - {eq.delegacia}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Equipes e Policiais */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-white">Equipes e Policiais:</h4>
                                    {equipesOperacao.length === 0 ? (
                                        <p className="text-gray-400 text-center py-4">
                                            Nenhuma equipe cadastrada para esta operação
                                        </p>
                                    ) : (
                                        equipesOperacao.map(equipe => {
                                            const equipeChegou = policiaisPresenca[`${operacao.id}-${equipe.id}-status`] === 'chegou';
                                            
                                            return (
                                                <div 
                                                    key={equipe.id} 
                                                    className={`bg-gray-600 rounded-lg p-4 border-2 ${
                                                        equipeChegou ? 'border-green-500' : 'border-gray-500'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-white flex items-center space-x-2">
                                                                <Users size={18} className="text-blue-400" />
                                                                <span>{equipe.departamento} - {equipe.delegacia}</span>
                                                                {equipeChegou && (
                                                                    <span className="bg-green-600 text-xs px-2 py-1 rounded">
                                                                        ✓ Chegou
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            {equipe.viatura && (
                                                                <p className="text-sm text-gray-300 mt-1">
                                                                    🚔 Viatura: {equipe.viatura}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleMarcarEquipeChegou(operacao.id, equipe.id)}
                                                            className={`px-4 py-2 rounded text-white text-sm ${
                                                                equipeChegou 
                                                                    ? 'bg-gray-500 hover:bg-gray-600' 
                                                                    : 'bg-green-600 hover:bg-green-700'
                                                            }`}
                                                        >
                                                            {equipeChegou ? 'Desmarcar' : 'Marcar Chegada'}
                                                        </button>
                                                    </div>

                                                    {/* Lista de Policiais */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h5 className="text-sm font-semibold text-gray-300">Policiais:</h5>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-xs text-gray-400">
                                                                    {(() => {
                                                                        let presentes = 0;
                                                                        let total = 0;
                                                                        if (equipe.chefe) {
                                                                            total++;
                                                                            if (policiaisPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}`]) presentes++;
                                                                        }
                                                                        if (equipe.membros) {
                                                                            total += equipe.membros.length;
                                                                            equipe.membros.forEach(m => {
                                                                                if (policiaisPresenca[`${operacao.id}-${equipe.id}-${m}`]) presentes++;
                                                                            });
                                                                        }
                                                                        return `${presentes}/${total} presentes`;
                                                                    })()}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        const novaPresenca = { ...policiaisPresenca };
                                                                        let todosMarcados = true;
                                                                        if (equipe.chefe && !novaPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}`]) {
                                                                            todosMarcados = false;
                                                                        }
                                                                        if (equipe.membros) {
                                                                            equipe.membros.forEach(m => {
                                                                                if (!novaPresenca[`${operacao.id}-${equipe.id}-${m}`]) {
                                                                                    todosMarcados = false;
                                                                                }
                                                                            });
                                                                        }
                                                                        
                                                                        const marcar = !todosMarcados;
                                                                        if (equipe.chefe) {
                                                                            novaPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}`] = marcar;
                                                                        }
                                                                        if (equipe.membros) {
                                                                            equipe.membros.forEach(m => {
                                                                                novaPresenca[`${operacao.id}-${equipe.id}-${m}`] = marcar;
                                                                            });
                                                                        }
                                                                        
                                                                        novaPresenca[`${operacao.id}-${equipe.id}-status`] = marcar ? 'chegou' : null;
                                                                        
                                                                        setPoliciaisPresenca(novaPresenca);
                                                                        showNotification(
                                                                            marcar ? 'Todos os policiais marcados como presentes!' : 'Todas as presenças desmarcadas',
                                                                            'success'
                                                                        );
                                                                    }}
                                                                    className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-xs text-white"
                                                                >
                                                                    ✓ Marcar Todos
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {equipe.chefe && (
                                                            <div className="bg-gray-700 p-3 rounded flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={policiaisPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}`] || false}
                                                                        onChange={() => handleMarcarPresenca(operacao.id, equipe.id, equipe.chefe)}
                                                                        className="w-5 h-5 rounded"
                                                                    />
                                                                    <span className="text-white">
                                                                        👮 {equipe.chefe} <span className="text-yellow-400 text-xs">(Líder)</span>
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setShowSubstituicaoModal({ operacaoId: operacao.id, equipeId: equipe.id, policial: equipe.chefe })}
                                                                    className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs text-white"
                                                                >
                                                                    Substituir
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Membros */}
                                                        {equipe.membros && equipe.membros.map((membro, idx) => (
                                                            <div key={idx} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={policiaisPresenca[`${operacao.id}-${equipe.id}-${membro}`] || false}
                                                                        onChange={() => handleMarcarPresenca(operacao.id, equipe.id, membro)}
                                                                        className="w-5 h-5 rounded"
                                                                    />
                                                                    <span className="text-white">👮 {membro}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setShowSubstituicaoModal({ operacaoId: operacao.id, equipeId: equipe.id, policial: membro })}
                                                                    className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs text-white"
                                                                >
                                                                    Substituir
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Botão Adicionar Policial */}
                                                        <button
                                                            onClick={() => {
                                                                const nomePolicial = prompt('Digite o nome do policial a adicionar:');
                                                                if (nomePolicial) {
                                                                    const equipesAtualizadas = equipes.map(eq => {
                                                                        if (eq.id === equipe.id) {
                                                                            return {
                                                                                ...eq,
                                                                                membros: [...(eq.membros || []), nomePolicial]
                                                                            };
                                                                        }
                                                                        return eq;
                                                                    });
                                                                    setEquipes(equipesAtualizadas);
                                                                    showNotification(`Policial ${nomePolicial} adicionado à equipe!`, 'success');
                                                                }
                                                            }}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white text-sm flex items-center justify-center space-x-2"
                                                        >
                                                            <Plus size={16} />
                                                            <span>Adicionar Policial</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
