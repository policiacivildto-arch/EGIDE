import React from 'react';
import { ClipboardList, AlertCircle, Users, Target, FileText, Download } from 'lucide-react';
import { AlvoForm } from './AlvoForm';
import { EquipeForm } from './EquipeForm';
import { PlanoForm } from './PlanoForm';
import { gerarPlanoOperacional } from '../utils/planoOperacional';

export function PlanejamentoView({ 
    operations, 
    selectedOperationId, 
    setSelectedOperationId,
    stats,
    showEquipeForm,
    setShowEquipeForm,
    showAlvoForm,
    setShowAlvoForm,
    showPlanoForm,
    setShowPlanoForm,
    equipes,
    setEquipes,
    alvos,
    setAlvos,
    draggedAlvo,
    setDraggedAlvo,
    showNotification,
    equipeForm,
    setEquipeForm,
    alvoForm,
    setAlvoForm,
    planoForm,
    setPlanoForm,
    setOperacoes,
    userDepartamento,
    isDTO
}) {
    const operacoesAprovadas = operations.filter(op => op.status === 'Aprovada pelo DTO');

    // Verificar se o usuário pode cadastrar alvos para a operação selecionada
    const operacaoAtual = operacoesAprovadas.find(op => op.id === selectedOperationId);
    const podeAdicionarAlvos = operacaoAtual && (
        isDTO || // DTO sempre pode
        operacaoAtual.responsavel_alvos === userDepartamento || // Departamento responsável pelos alvos
        operacaoAtual.departamento_demandante === userDepartamento // Departamento demandante
    );

    const podeAdicionarEquipes = operacaoAtual && (
        isDTO || // DTO sempre pode (gerencia a operação)
        (!operacaoAtual.precisa_apoio_dto && operacaoAtual.departamento_demandante === userDepartamento) // Operação interna
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Planejamento de Operações</h2>
                <div className="text-sm text-gray-400">
                    {stats.aprovadas} operação(ões) aguardando planejamento
                </div>
            </div>

            {operacoesAprovadas.length === 0 ? (
                <div className="bg-gray-700 p-12 rounded-lg text-center">
                    <AlertCircle size={64} className="mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-lg">Nenhuma operação aprovada para planejamento</p>
                    <p className="text-gray-500 text-sm mt-2">
                        As operações aparecerão aqui após serem aprovadas pelo DTO
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Operações Aprovadas */}
                    <div className="lg:col-span-1 bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Operações Aprovadas</h3>
                        <div className="space-y-2">
                            {operacoesAprovadas.map((op) => (
                                <button
                                    key={op.id}
                                    onClick={() => setSelectedOperationId(op.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                        selectedOperationId === op.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                    }`}
                                >
                                    <div className="font-semibold">{op.nome}</div>
                                    <div className="text-xs mt-1 opacity-75">
                                        {op.departamento_solicitante_sigla} • {op.total_equipes || 0} equipes
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Área de Planejamento */}
                    <div className="lg:col-span-2 space-y-4">
                        {!selectedOperationId ? (
                            <div className="bg-gray-700 p-12 rounded-lg text-center">
                                <ClipboardList size={64} className="mx-auto mb-4 text-gray-500" />
                                <p className="text-gray-400">
                                    Selecione uma operação para iniciar o planejamento
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Operação Selecionada */}
                                <div className="bg-gradient-to-r from-cyan-600 to-teal-700 p-4 rounded-lg">
                                    <h3 className="text-xl font-bold text-white">
                                        {operacoesAprovadas.find(op => op.id === selectedOperationId)?.nome}
                                    </h3>
                                    <p className="text-cyan-100 text-sm mt-1">
                                        Configure as equipes e viaturas para esta operação
                                    </p>
                                    <div className="mt-3 flex gap-3 text-xs">
                                        <span className="bg-cyan-800/50 px-3 py-1 rounded">
                                            <strong>Responsável pela Operação:</strong> {operacaoAtual?.responsavel_operacao || 'DTO'}
                                        </span>
                                        <span className="bg-yellow-800/50 px-3 py-1 rounded border border-yellow-500">
                                            <strong>Cadastro de Alvos:</strong> {operacaoAtual?.responsavel_alvos || operacaoAtual?.departamento_demandante || 'Departamento Demandante'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info sobre permissões */}
                                {!podeAdicionarAlvos && operacaoAtual?.precisa_apoio_dto && (
                                    <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                                        <p className="text-yellow-200 text-sm flex items-center gap-2">
                                            <AlertCircle size={18} />
                                            <span>
                                                <strong>Atenção:</strong> O DTO gerencia esta operação, mas o cadastro de alvos 
                                                é de responsabilidade do departamento demandante ({operacaoAtual?.departamento_demandante}).
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Botões de Ação */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => podeAdicionarAlvos ? setShowAlvoForm(!showAlvoForm) : showNotification('Apenas o departamento demandante pode cadastrar alvos', 'error')}
                                        disabled={!podeAdicionarAlvos}
                                        className={`p-4 rounded-lg flex items-center justify-center space-x-2 ${
                                            podeAdicionarAlvos 
                                                ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                                        }`}
                                        title={!podeAdicionarAlvos ? 'Apenas o departamento demandante pode cadastrar alvos' : ''}
                                    >
                                        <Target size={20} />
                                        <span>Adicionar Alvo</span>
                                    </button>
                                    <button
                                        onClick={() => podeAdicionarEquipes ? setShowEquipeForm(!showEquipeForm) : showNotification('Apenas o DTO pode gerenciar equipes nesta operação', 'error')}
                                        disabled={!podeAdicionarEquipes}
                                        className={`p-4 rounded-lg flex items-center justify-center space-x-2 ${
                                            podeAdicionarEquipes 
                                                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                                        }`}
                                        title={!podeAdicionarEquipes ? 'Apenas o DTO pode gerenciar equipes' : ''}
                                    >
                                        <Users size={20} />
                                        <span>Adicionar Equipe</span>
                                    </button>
                                    <button
                                        onClick={() => setShowPlanoForm(!showPlanoForm)}
                                        className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg flex items-center justify-center space-x-2"
                                    >
                                        <FileText size={20} />
                                        <span>Plano Operacional</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const operacaoAtual = operacoesAprovadas.find(op => op.id === selectedOperationId);
                                            const equipesOperacao = equipes.filter(eq => eq.operacaoId === selectedOperationId);
                                            const alvosOperacao = alvos.filter(a => a.operacaoId === selectedOperationId);
                                            
                                            if (equipesOperacao.length === 0) {
                                                showNotification('Adicione equipes antes de gerar o plano', 'warning');
                                                return;
                                            }
                                            
                                            gerarPlanoOperacional(operacaoAtual, equipesOperacao, alvosOperacao);
                                            showNotification('Plano operacional gerado com sucesso!', 'success');
                                        }}
                                        className="bg-green-600 hover:bg-green-700 p-4 rounded-lg flex items-center justify-center space-x-2"
                                    >
                                        <Download size={20} />
                                        <span>Baixar Plano</span>
                                    </button>
                                </div>

                                {/* Formulários condicionais */}
                                {showAlvoForm && (
                                    <AlvoForm
                                        alvoForm={alvoForm}
                                        setAlvoForm={setAlvoForm}
                                        alvos={alvos}
                                        setAlvos={setAlvos}
                                        selectedOperationId={selectedOperationId}
                                        showNotification={showNotification}
                                        setShowAlvoForm={setShowAlvoForm}
                                    />
                                )}
                                {showEquipeForm && (
                                    <EquipeForm
                                        equipeForm={equipeForm}
                                        setEquipeForm={setEquipeForm}
                                        equipes={equipes}
                                        setEquipes={setEquipes}
                                        selectedOperationId={selectedOperationId}
                                        showNotification={showNotification}
                                        setShowEquipeForm={setShowEquipeForm}
                                    />
                                )}
                                {showPlanoForm && (
                                    <PlanoForm
                                        planoForm={planoForm}
                                        setPlanoForm={setPlanoForm}
                                        selectedOperationId={selectedOperationId}
                                        showNotification={showNotification}
                                        setShowPlanoForm={setShowPlanoForm}
                                        setOperacoes={setOperacoes}
                                        operacaoAtual={operacaoAtual}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
