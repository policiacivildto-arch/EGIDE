// RelatorioView.js - Componente de Relatório de Operações em Tempo Real
import React, { useState } from 'react';
import { FileText, ArrowRight, ArrowLeft, AlertCircle, Users } from 'lucide-react';

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
    setEquipes,
    userData
}) {
    const [substituteSelectorOpen, setSubstituteSelectorOpen] = useState({});
    const [substituteSearchTerms, setSubstituteSearchTerms] = useState({});

    const normalizeOfficerName = (name) => String(name || '').trim();
    const getOfficerDisplayName = (name) => normalizeOfficerName(name) || 'Sem nome';

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
        const substitutoKey = `${key}-substituto`;
        const marcando = !novaPresenca[key];
        novaPresenca[key] = marcando;

        if (marcando) {
            delete novaPresenca[substitutoKey];
        }

        if (marcando) {
            novaPresenca[`${operacaoId}-${equipeId}-status`] = 'chegou';
            showNotification('Presença confirmada! Equipe marcada como chegada.', 'success');
        }
        setPoliciaisPresenca(novaPresenca);
    };

    const getAttendanceWindow = (operacao) => {
        const now = new Date();
        const start = operacao?.data_hora_inicio ? new Date(operacao.data_hora_inicio) : null;
        const end = operacao?.data_hora_fim ? new Date(operacao.data_hora_fim) : start;

        if (!start || Number.isNaN(start.getTime())) {
            return { canMarkActions: true, windowLabel: 'Horário da operação não informado' };
        }

        let endDate = end;
        if (!endDate || Number.isNaN(endDate.getTime())) {
            endDate = start;
        }
        if (endDate <= start) {
            endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        }

        const windowStart = new Date(start.getTime() - 60 * 60 * 1000);
        const windowEnd = new Date(endDate.getTime() + 60 * 60 * 1000);

        return {
            canMarkActions: now >= windowStart && now <= windowEnd,
            windowLabel: `${windowStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} até ${windowEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        };
    };

    const getCandidateNames = (operacaoId, policialAtual) => {
        const nomes = new Set();
        equipes
            .filter((eq) => eq.operacaoId === operacaoId)
            .forEach((eq) => {
                const chefe = normalizeOfficerName(eq.chefe);
                if (chefe) nomes.add(chefe);
                if (Array.isArray(eq.membros)) {
                    eq.membros.forEach((nome) => {
                        const nomeLimpo = normalizeOfficerName(nome);
                        if (nomeLimpo) nomes.add(nomeLimpo);
                    });
                }
            });

        nomes.delete(normalizeOfficerName(policialAtual));
        return Array.from(nomes).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    };

    const handleOpenSubstituteSelector = (operacaoId, equipeId, policial) => {
        const key = `${operacaoId}-${equipeId}-${policial}`;
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: !prev[key] }));
        setSubstituteSearchTerms((prev) => ({ ...prev, [key]: '' }));
    };

    const handleSelectSubstitute = (operacaoId, equipeId, policial, substitutoNome) => {
        const key = `${operacaoId}-${equipeId}-${policial}`;
        const substitutoKey = `${key}-substituto`;
        const novoEstado = {
            ...policiaisPresenca,
            [key]: true,
            [substitutoKey]: substitutoNome,
            [`${operacaoId}-${equipeId}-status`]: 'chegou',
        };

        setPoliciaisPresenca(novoEstado);
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: false }));
        showNotification(`Substituição registrada: ${policial} -> ${substitutoNome}`, 'success');
    };

    const getEquipesFaltam = (operacaoId) => {
        return equipes.filter(eq => !policiaisPresenca[`${operacaoId}-${eq.id}-status`]);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                    <FileText className="text-cyan-400" size={28} />
                    <span>Frequência Operacional</span>
                </h2>
                                <p className="text-gray-400 mb-6">Controle de presença e substituição em tempo real</p>

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
                                            const { canMarkActions, windowLabel } = getAttendanceWindow(operacao);
                                            
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
                                                            <p className="text-xs text-gray-400 mt-2">
                                                                Janela para confirmar presença/substituição: {windowLabel} {canMarkActions ? '✅ permitido' : '🔒 fora do horário'}
                                                            </p>
                                                        </div>
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
                                                            </div>
                                                        </div>
                                                        {equipe.chefe && (
                                                            <div className="bg-gray-700 p-3 rounded flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-white">
                                                                        👮 {getOfficerDisplayName(equipe.chefe)} <span className="text-yellow-400 text-xs">(Líder)</span>
                                                                    </span>
                                                                    {policiaisPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}-substituto`] && (
                                                                        <span className="text-xs text-purple-300">
                                                                            (Substituído por {policiaisPresenca[`${operacao.id}-${equipe.id}-${equipe.chefe}-substituto`]})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleMarcarPresenca(operacao.id, equipe.id, equipe.chefe)}
                                                                        disabled={!canMarkActions}
                                                                        title={canMarkActions ? 'Confirmar presença' : `Fora da janela permitida: ${windowLabel}`}
                                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                                                                    >
                                                                        Presença
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOpenSubstituteSelector(operacao.id, equipe.id, equipe.chefe)}
                                                                        disabled={!canMarkActions}
                                                                        title={canMarkActions ? 'Registrar substituição' : `Fora da janela permitida: ${windowLabel}`}
                                                                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                                                                    >
                                                                        Substituir
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Membros */}
                                                        {equipe.membros && equipe.membros.map((membro, idx) => (
                                                            <div key={idx} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-white">👮 {getOfficerDisplayName(membro)}</span>
                                                                    {policiaisPresenca[`${operacao.id}-${equipe.id}-${membro}-substituto`] && (
                                                                        <span className="text-xs text-purple-300">
                                                                            (Substituído por {policiaisPresenca[`${operacao.id}-${equipe.id}-${membro}-substituto`]})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleMarcarPresenca(operacao.id, equipe.id, membro)}
                                                                        disabled={!canMarkActions}
                                                                        title={canMarkActions ? 'Confirmar presença' : `Fora da janela permitida: ${windowLabel}`}
                                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                                                                    >
                                                                        Presença
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOpenSubstituteSelector(operacao.id, equipe.id, membro)}
                                                                        disabled={!canMarkActions}
                                                                        title={canMarkActions ? 'Registrar substituição' : `Fora da janela permitida: ${windowLabel}`}
                                                                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                                                                    >
                                                                        Substituir
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {equipe.chefe && substituteSelectorOpen[`${operacao.id}-${equipe.id}-${equipe.chefe}`] && (
                                                            <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Buscar substituto para ${equipe.chefe}...`}
                                                                    value={substituteSearchTerms[`${operacao.id}-${equipe.id}-${equipe.chefe}`] || ''}
                                                                    onChange={(e) => setSubstituteSearchTerms((prev) => ({ ...prev, [`${operacao.id}-${equipe.id}-${equipe.chefe}`]: e.target.value }))}
                                                                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white border border-gray-600"
                                                                />
                                                                <div className="max-h-36 overflow-y-auto space-y-1">
                                                                    {getCandidateNames(operacao.id, equipe.chefe)
                                                                        .filter((nome) => {
                                                                            const termo = (substituteSearchTerms[`${operacao.id}-${equipe.id}-${equipe.chefe}`] || '').trim().toLowerCase();
                                                                            return !termo || nome.toLowerCase().includes(termo);
                                                                        })
                                                                        .map((nome) => (
                                                                            <button
                                                                                key={nome}
                                                                                type="button"
                                                                                onClick={() => handleSelectSubstitute(operacao.id, equipe.id, equipe.chefe, nome)}
                                                                                className="w-full text-left px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                                                                            >
                                                                                {nome}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {equipe.membros && equipe.membros.map((membro) => {
                                                            const selectorKey = `${operacao.id}-${equipe.id}-${membro}`;
                                                            if (!substituteSelectorOpen[selectorKey]) {
                                                                return null;
                                                            }

                                                            const termoBusca = (substituteSearchTerms[selectorKey] || '').trim().toLowerCase();
                                                            const candidatos = getCandidateNames(operacao.id, membro).filter((nome) => !termoBusca || nome.toLowerCase().includes(termoBusca));

                                                            return (
                                                                <div key={`${selectorKey}-busca`} className="bg-gray-800 p-3 rounded border border-gray-600">
                                                                    <input
                                                                        type="text"
                                                                        placeholder={`Buscar substituto para ${membro}...`}
                                                                        value={substituteSearchTerms[selectorKey] || ''}
                                                                        onChange={(e) => setSubstituteSearchTerms((prev) => ({ ...prev, [selectorKey]: e.target.value }))}
                                                                        className="w-full p-2 mb-2 rounded bg-gray-700 text-white border border-gray-600"
                                                                    />
                                                                    <div className="max-h-36 overflow-y-auto space-y-1">
                                                                        {candidatos.map((nome) => (
                                                                            <button
                                                                                key={`${selectorKey}-${nome}`}
                                                                                type="button"
                                                                                onClick={() => handleSelectSubstitute(operacao.id, equipe.id, membro, nome)}
                                                                                className="w-full text-left px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                                                                            >
                                                                                {nome}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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
