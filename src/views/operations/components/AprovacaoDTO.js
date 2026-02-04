import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Users } from 'lucide-react';

/**
 * Componente de Aprovação de Operações para o DTO
 * Lista todas as operações aguardando aprovação
 */
export const AprovacaoDTO = ({ operations, showNotification, onAprovar, onRejeitar }) => {
    const [motivoRejeicao, setMotivoRejeicao] = useState('');
    const [operacaoSelecionada, setOperacaoSelecionada] = useState(null);
    const [showRejeicaoModal, setShowRejeicaoModal] = useState(false);

    // Debug
    console.log('🔍 AprovacaoDTO - Total de operações recebidas:', operations.length);
    console.log('🔍 AprovacaoDTO - Operações:', operations);

    // Filtrar operações aguardando aprovação
    const operacoesAguardando = operations.filter(op => 
        op.status_dto === 'Aguardando Análise DTO' || 
        op.status_dto === 'Pendente' ||
        op.status === 'Aguardando Análise DTO' ||
        op.status === 'Aguardando Aprovação'
    );

    console.log('🔍 AprovacaoDTO - Operações aguardando:', operacoesAguardando.length);
    console.log('🔍 AprovacaoDTO - Detalhes:', operacoesAguardando);

    const handleAprovar = (operacao) => {
        if (window.confirm(`Confirma a aprovação da operação "${operacao.nome}"?`)) {
            onAprovar(operacao.id);
            showNotification(`Operação "${operacao.nome}" aprovada com sucesso!`, 'success');
        }
    };

    const handleRejeitarClick = (operacao) => {
        setOperacaoSelecionada(operacao);
        setMotivoRejeicao('');
        setShowRejeicaoModal(true);
    };

    const handleRejeitarConfirmar = () => {
        if (!motivoRejeicao.trim()) {
            showNotification('Por favor, informe o motivo da rejeição', 'error');
            return;
        }

        onRejeitar(operacaoSelecionada.id, motivoRejeicao);
        showNotification(`Operação "${operacaoSelecionada.nome}" rejeitada`, 'info');
        setShowRejeicaoModal(false);
        setOperacaoSelecionada(null);
        setMotivoRejeicao('');
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    <AlertCircle className="inline mr-2" size={28} />
                    Aprovação de Operações - DTO
                </h2>
                <p className="text-gray-400">Analise e aprove as operações solicitadas pelos departamentos</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-400 text-sm font-semibold">Aguardando Aprovação</p>
                            <p className="text-3xl font-bold text-white">{operacoesAguardando.length}</p>
                        </div>
                        <Clock size={40} className="text-yellow-400" />
                    </div>
                </div>

                <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-400 text-sm font-semibold">Aprovadas</p>
                            <p className="text-3xl font-bold text-white">
                                {operations.filter(op => op.status_dto === 'Aprovado DTO').length}
                            </p>
                        </div>
                        <CheckCircle size={40} className="text-green-400" />
                    </div>
                </div>

                <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-400 text-sm font-semibold">Rejeitadas</p>
                            <p className="text-3xl font-bold text-white">
                                {operations.filter(op => op.status_dto === 'Rejeitado DTO').length}
                            </p>
                        </div>
                        <XCircle size={40} className="text-red-400" />
                    </div>
                </div>
            </div>

            {/* Lista de Operações Aguardando */}
            {operacoesAguardando.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                    <p className="text-gray-400 text-lg">Nenhuma operação aguardando aprovação</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {operacoesAguardando.map((operacao) => (
                        <div 
                            key={operacao.id} 
                            className="bg-gray-800 border border-yellow-500/50 rounded-lg p-6 hover:border-yellow-500 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {operacao.nome || 'Operação Sem Nome'}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Departamento Solicitante:</p>
                                            <p className="text-white font-semibold">
                                                {operacao.departamento_solicitante || operacao.orgao_solicitante || 'Não informado'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Data Prevista:</p>
                                            <p className="text-white font-semibold">
                                                {operacao.data_inicio ? new Date(operacao.data_inicio).toLocaleDateString('pt-BR') : 'Não informada'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Horário:</p>
                                            <p className="text-white font-semibold">
                                                {operacao.hora_inicio || '08:00'} - {operacao.hora_fim || '18:00'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Delegacia Responsável:</p>
                                            <p className="text-white font-semibold">
                                                {operacao.delegacia_responsavel || 'Não informada'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900/50 text-yellow-400 border border-yellow-500">
                                        <Clock size={14} className="mr-1" />
                                        Aguardando
                                    </span>
                                </div>
                            </div>

                            {/* Detalhes da Operação */}
                            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                                <h4 className="text-white font-semibold mb-2 flex items-center">
                                    <FileText size={16} className="mr-2" />
                                    Objetivo da Operação:
                                </h4>
                                <p className="text-gray-300 text-sm">
                                    {operacao.objetivo || 'Não informado'}
                                </p>
                            </div>

                            {/* Efetivo Solicitado */}
                            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                                <h4 className="text-white font-semibold mb-3 flex items-center">
                                    <Users size={16} className="mr-2" />
                                    Efetivo Solicitado:
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    {operacao.precisa_apoio_dto && (
                                        <>
                                            <div className="bg-blue-900/30 rounded px-3 py-2">
                                                <p className="text-blue-400 font-semibold">Apoio DTO - DPC</p>
                                                <p className="text-white text-lg">{operacao.dto_apoio_dpc || 0}</p>
                                            </div>
                                            <div className="bg-blue-900/30 rounded px-3 py-2">
                                                <p className="text-blue-400 font-semibold">Apoio DTO - OIP</p>
                                                <p className="text-white text-lg">{operacao.dto_apoio_oip || 0}</p>
                                            </div>
                                        </>
                                    )}
                                    <div className="bg-gray-800 rounded px-3 py-2">
                                        <p className="text-gray-400 font-semibold">Interno - DPC</p>
                                        <p className="text-white text-lg">{operacao.efetivo_interno_dpc || 0}</p>
                                    </div>
                                    <div className="bg-gray-800 rounded px-3 py-2">
                                        <p className="text-gray-400 font-semibold">Interno - OIP</p>
                                        <p className="text-white text-lg">{operacao.efetivo_interno_oip || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAprovar(operacao)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <CheckCircle size={20} className="mr-2" />
                                    Aprovar Operação
                                </button>
                                <button
                                    onClick={() => handleRejeitarClick(operacao)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <XCircle size={20} className="mr-2" />
                                    Rejeitar Operação
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Rejeição */}
            {showRejeicaoModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Rejeitar Operação: {operacaoSelecionada?.nome}
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-white font-semibold mb-2">
                                Motivo da Rejeição: <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={motivoRejeicao}
                                onChange={(e) => setMotivoRejeicao(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 h-32 resize-none focus:border-red-500 focus:outline-none"
                                placeholder="Descreva o motivo da rejeição..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejeicaoModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRejeitarConfirmar}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Confirmar Rejeição
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
