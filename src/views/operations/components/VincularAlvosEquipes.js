import React, { useState } from 'react';
import { Target, Link as LinkIcon, Users, AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * Componente para Vincular Alvos às Equipes
 * Permite associar alvos específicos a equipes escaladas na operação
 */
export const VincularAlvosEquipes = ({ operacoes, equipes, alvos, onVincular, showNotification }) => {
    const [operacaoSelecionada, setOperacaoSelecionada] = useState('');
    const [vinculacoes, setVinculacoes] = useState({}); // {alvoId: [equipeIds]}
    const [showModal, setShowModal] = useState(false);
    const [alvoAtual, setAlvoAtual] = useState(null);

    // Filtrar equipes da operação selecionada
    const equipesDaOperacao = operacaoSelecionada 
        ? equipes.filter(eq => eq.operacaoId === parseInt(operacaoSelecionada))
        : [];

    // Filtrar alvos da operação selecionada
    const alvosDaOperacao = operacaoSelecionada
        ? alvos.filter(alvo => alvo.operacaoId === parseInt(operacaoSelecionada))
        : [];

    const handleVincularClick = (alvo) => {
        setAlvoAtual(alvo);
        setShowModal(true);
    };

    const toggleEquipeVinculacao = (equipeId) => {
        const alvoId = alvoAtual.id;
        setVinculacoes(prev => {
            const vinculadas = prev[alvoId] || [];
            const novasVinculadas = vinculadas.includes(equipeId)
                ? vinculadas.filter(id => id !== equipeId)
                : [...vinculadas, equipeId];
            
            return {
                ...prev,
                [alvoId]: novasVinculadas
            };
        });
    };

    const handleSalvarVinculacao = () => {
        const alvoId = alvoAtual.id;
        const equipesVinculadas = vinculacoes[alvoId] || [];
        
        if (equipesVinculadas.length === 0) {
            showNotification('Selecione pelo menos uma equipe', 'error');
            return;
        }

        onVincular(alvoId, equipesVinculadas);
        showNotification(`Alvo "${alvoAtual.nome}" vinculado a ${equipesVinculadas.length} equipe(s)`, 'success');
        setShowModal(false);
        setAlvoAtual(null);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    <LinkIcon className="inline mr-2" size={28} />
                    Vincular Alvos às Equipes
                </h2>
                <p className="text-gray-400">Associe alvos específicos às equipes que farão o cumprimento</p>
            </div>

            {/* Seleção de Operação */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <label className="block text-white font-semibold mb-2">
                    Selecione a Operação:
                </label>
                <select
                    value={operacaoSelecionada}
                    onChange={(e) => setOperacaoSelecionada(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                >
                    <option value="">-- Selecione uma operação --</option>
                    {operacoes.map(op => (
                        <option key={op.id} value={op.id}>
                            {op.nome} - {op.data_inicio ? new Date(op.data_inicio).toLocaleDateString('pt-BR') : 'Data não definida'}
                        </option>
                    ))}
                </select>
            </div>

            {operacaoSelecionada && (
                <>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-400 text-sm font-semibold">Total de Alvos</p>
                                    <p className="text-3xl font-bold text-white">{alvosDaOperacao.length}</p>
                                </div>
                                <Target size={40} className="text-blue-400" />
                            </div>
                        </div>

                        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-400 text-sm font-semibold">Equipes Escaladas</p>
                                    <p className="text-3xl font-bold text-white">{equipesDaOperacao.length}</p>
                                </div>
                                <Users size={40} className="text-green-400" />
                            </div>
                        </div>

                        <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-400 text-sm font-semibold">Alvos Vinculados</p>
                                    <p className="text-3xl font-bold text-white">
                                        {Object.values(vinculacoes).filter(v => v.length > 0).length}
                                    </p>
                                </div>
                                <CheckCircle size={40} className="text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* Lista de Alvos */}
                    {alvosDaOperacao.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-8 text-center">
                            <AlertCircle size={48} className="mx-auto text-yellow-400 mb-4" />
                            <p className="text-gray-400 text-lg">Nenhum alvo cadastrado para esta operação</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alvosDaOperacao.map((alvo) => {
                                const equipesVinculadas = vinculacoes[alvo.id] || [];
                                const temVinculacao = equipesVinculadas.length > 0;

                                return (
                                    <div 
                                        key={alvo.id}
                                        className={`bg-gray-800 rounded-lg p-6 border-2 ${
                                            temVinculacao ? 'border-green-500/50' : 'border-gray-700'
                                        } hover:border-blue-500/50 transition-colors`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-bold text-white">
                                                        {alvo.nome || 'Nome não informado'}
                                                    </h3>
                                                    {temVinculacao && (
                                                        <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-semibold border border-green-500">
                                                            Vinculado
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                                    {alvo.cpf && (
                                                        <div>
                                                            <p className="text-gray-400">CPF:</p>
                                                            <p className="text-white font-semibold">{alvo.cpf}</p>
                                                        </div>
                                                    )}
                                                    {alvo.endereco && (
                                                        <div className="col-span-2">
                                                            <p className="text-gray-400">Endereço:</p>
                                                            <p className="text-white font-semibold">{alvo.endereco}</p>
                                                        </div>
                                                    )}
                                                    {alvo.bairro && (
                                                        <div>
                                                            <p className="text-gray-400">Bairro:</p>
                                                            <p className="text-white font-semibold">{alvo.bairro}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Equipes Vinculadas */}
                                                {temVinculacao && (
                                                    <div className="bg-green-900/20 rounded-lg p-3 mb-3">
                                                        <p className="text-green-400 font-semibold text-sm mb-2">
                                                            Equipes Vinculadas ({equipesVinculadas.length}):
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {equipesVinculadas.map(eqId => {
                                                                const equipe = equipesDaOperacao.find(eq => eq.id === eqId);
                                                                return equipe ? (
                                                                    <span 
                                                                        key={eqId}
                                                                        className="px-3 py-1 bg-green-800/50 text-green-300 rounded text-xs border border-green-600"
                                                                    >
                                                                        {equipe.delegacia || equipe.departamento} - {equipe.chefe}
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleVincularClick(alvo)}
                                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                                            >
                                                <LinkIcon size={16} className="mr-2" />
                                                {temVinculacao ? 'Editar' : 'Vincular'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Modal de Vinculação */}
            {showModal && alvoAtual && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-lg max-w-4xl w-full p-6 my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                Vincular Alvo: {alvoAtual.nome}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-400 mb-4">
                                Selecione as equipes que ficarão responsáveis por este alvo:
                            </p>

                            {equipesDaOperacao.length === 0 ? (
                                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 text-center">
                                    <AlertCircle className="mx-auto mb-2 text-yellow-400" size={32} />
                                    <p className="text-yellow-400">Nenhuma equipe cadastrada nesta operação</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {equipesDaOperacao.map(equipe => {
                                        const isVinculada = (vinculacoes[alvoAtual.id] || []).includes(equipe.id);
                                        
                                        return (
                                            <div
                                                key={equipe.id}
                                                onClick={() => toggleEquipeVinculacao(equipe.id)}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                    isVinculada
                                                        ? 'bg-green-900/30 border-green-500'
                                                        : 'bg-gray-900/50 border-gray-600 hover:border-blue-500'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-white font-semibold">
                                                            {equipe.delegacia || equipe.departamento}
                                                        </p>
                                                        <p className="text-gray-400 text-sm">
                                                            Chefe: {equipe.chefe} | Viatura: {equipe.viatura || 'N/A'}
                                                        </p>
                                                        {equipe.membros && equipe.membros.length > 0 && (
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                {equipe.membros.length} membro(s)
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isVinculada && (
                                                        <CheckCircle className="text-green-400 ml-4" size={24} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvarVinculacao}
                                disabled={equipesDaOperacao.length === 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                Salvar Vinculação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
