import React, { useState } from 'react';
import { Target, Users, CheckCircle, Send, X, MapPin, AlertCircle } from 'lucide-react';

export function MeusAlvosView({ alvosDoPolicialAtual, equipesDoPolicialAtual, showNotification, onRegistrarInformacoes }) {
    const [alvoSelecionado, setAlvoSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [informacoes, setInformacoes] = useState({
        status: '',
        localizacao: '',
        observacoes: '',
        dataHora: new Date().toISOString().slice(0, 16),
        // Resultados da diligência
        mpCumpridos: 0,
        mpDiligenciados: 0,
        flagrante: 0,
        buscaCumpridos: 0,
        mbaDiligenciados: 0,
        medidasCautelares: 0,
        // Apreensões
        qtdCelular: 0,
        qtdVeiculo: 0,
        qtdMunicoes: 0,
        qtdArma: 0,
        dinheiro: 0,
        droga: ''
    });

    const handleAbrirModal = (alvo) => {
        setAlvoSelecionado(alvo);
        setShowModal(true);
        setInformacoes({
            status: '',
            localizacao: '',
            observacoes: '',
            dataHora: new Date().toISOString().slice(0, 16),
            mpCumpridos: 0,
            mpDiligenciados: 0,
            flagrante: 0,
            buscaCumpridos: 0,
            mbaDiligenciados: 0,
            medidasCautelares: 0,
            qtdCelular: 0,
            qtdVeiculo: 0,
            qtdMunicoes: 0,
            qtdArma: 0,
            dinheiro: 0,
            droga: ''
        });
    };

    const handleEnviarInformacoes = () => {
        if (!informacoes.status) {
            showNotification('Selecione o status do alvo', 'error');
            return;
        }

        const dados = {
            alvoId: alvoSelecionado.id,
            alvoNome: alvoSelecionado.nome,
            ...informacoes,
            timestamp: new Date().toISOString()
        };

        onRegistrarInformacoes(dados);
        showNotification(`Informações sobre ${alvoSelecionado.nome} enviadas com sucesso!`, 'success');
        setShowModal(false);
        setAlvoSelecionado(null);
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-red-900 to-red-700 rounded-lg p-6">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center space-x-2">
                    <Target size={32} />
                    <span>Meus Alvos</span>
                </h2>
                <p className="text-red-200">Alvos vinculados às suas equipes - Clique para registrar informações</p>
            </div>

            {/* Lista de Alvos */}
            {alvosDoPolicialAtual.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                    <Target size={64} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum alvo vinculado</h3>
                    <p className="text-gray-500">Você não possui alvos atribuídos às suas equipes no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {alvosDoPolicialAtual.map((alvo) => {
                        const equipesVinculadas = alvo.equipesVinculadas 
                            ? equipesDoPolicialAtual.filter(eq => alvo.equipesVinculadas.includes(eq.id))
                            : [];

                        return (
                            <div 
                                key={alvo.id} 
                                className="bg-gray-800 rounded-lg p-6 border border-red-900 hover:border-red-600 transition-all cursor-pointer hover:shadow-lg hover:shadow-red-900/50"
                                onClick={() => handleAbrirModal(alvo)}
                            >
                                {/* Identificação */}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-1">{alvo.nome || 'Nome não informado'}</h3>
                                    {alvo.vulgo && (
                                        <p className="text-sm text-red-400 italic">"{alvo.vulgo}"</p>
                                    )}
                                    {alvo.envolvimento && (
                                        <p className="text-xs text-gray-400 mt-1">🚨 {alvo.envolvimento}</p>
                                    )}
                                </div>

                                {/* Dados Pessoais */}
                                <div className="space-y-2 mb-4 text-sm">
                                    {alvo.cpf && (
                                        <div>
                                            <span className="text-gray-400">CPF:</span>
                                            <span className="text-white ml-2">{alvo.cpf}</span>
                                        </div>
                                    )}
                                    {alvo.endereco && (
                                        <div>
                                            <span className="text-gray-400">Endereço:</span>
                                            <span className="text-white ml-2 text-xs">{alvo.endereco}, {alvo.bairro}</span>
                                        </div>
                                    )}
                                    {alvo.mandado && (
                                        <div className="bg-red-900/30 px-2 py-1 rounded text-xs text-red-300 font-semibold">
                                            ⚠️ Mandado de Prisão Ativo
                                        </div>
                                    )}
                                </div>

                                {/* Equipes Vinculadas */}
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-2">MINHAS EQUIPES VINCULADAS</h4>
                                    {equipesVinculadas.length > 0 ? (
                                        <div className="space-y-1">
                                            {equipesVinculadas.map(eq => (
                                                <div key={eq.id} className="text-xs text-cyan-400 flex items-center space-x-2">
                                                    <Users size={12} />
                                                    <span>{eq.departamento} - {eq.delegacia}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Nenhuma equipe vinculada</p>
                                    )}
                                </div>

                                {/* Botão de Ação */}
                                <button 
                                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center space-x-2 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAbrirModal(alvo);
                                    }}
                                >
                                    <Send size={16} />
                                    <span>Registrar Informações</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Registro de Informações */}
            {showModal && alvoSelecionado && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-red-900 to-red-700 p-6 rounded-t-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{alvoSelecionado.nome}</h3>
                                    {alvoSelecionado.vulgo && (
                                        <p className="text-red-200 italic">"{alvoSelecionado.vulgo}"</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white hover:text-red-200 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6 space-y-6">
                            {/* Informações do Alvo */}
                            <div className="bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
                                <h4 className="font-semibold text-white mb-3">📋 Informações do Alvo</h4>
                                {alvoSelecionado.cpf && (
                                    <div><span className="text-gray-400">CPF:</span> <span className="text-white ml-2">{alvoSelecionado.cpf}</span></div>
                                )}
                                {alvoSelecionado.envolvimento && (
                                    <div><span className="text-gray-400">Envolvimento:</span> <span className="text-white ml-2">{alvoSelecionado.envolvimento}</span></div>
                                )}
                                {alvoSelecionado.endereco && (
                                    <div><span className="text-gray-400">Endereço:</span> <span className="text-white ml-2">{alvoSelecionado.endereco}, {alvoSelecionado.bairro} - {alvoSelecionado.cidade}</span></div>
                                )}
                                {alvoSelecionado.mandado && (
                                    <div className="bg-red-900/30 px-3 py-2 rounded text-red-300 font-semibold">
                                        ⚠️ Mandado de Prisão Ativo - Nº {alvoSelecionado.numeroInquerito}
                                    </div>
                                )}
                            </div>

                            {/* Formulário */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-2 font-semibold">Status do Alvo *</label>
                                    <select
                                        value={informacoes.status}
                                        onChange={(e) => setInformacoes({ ...informacoes, status: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-4 py-3 border border-gray-600 focus:border-red-500 focus:outline-none"
                                    >
                                        <option value="">Selecione o status</option>
                                        <option value="Localizado">✅ Localizado</option>
                                        <option value="Capturado">🚔 Capturado</option>
                                        <option value="Não Localizado">❌ Não Localizado</option>
                                        <option value="Em Deslocamento">🚗 Em Deslocamento</option>
                                        <option value="No Local">📍 No Local</option>
                                        <option value="Foragido">⚠️ Foragido</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2 font-semibold">Localização Atual</label>
                                    <input
                                        type="text"
                                        value={informacoes.localizacao}
                                        onChange={(e) => setInformacoes({ ...informacoes, localizacao: e.target.value })}
                                        placeholder="Endereço ou ponto de referência"
                                        className="w-full bg-gray-700 text-white rounded px-4 py-3 border border-gray-600 focus:border-red-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2 font-semibold">Data e Hora</label>
                                    <input
                                        type="datetime-local"
                                        value={informacoes.dataHora}
                                        onChange={(e) => setInformacoes({ ...informacoes, dataHora: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-4 py-3 border border-gray-600 focus:border-red-500 focus:outline-none"
                                    />
                                </div>

                                {/* RESULTADOS DA DILIGÊNCIA */}
                                <div className="bg-gray-700 p-4 rounded-lg space-y-4 border-2 border-yellow-600">
                                    <h4 className="font-semibold text-yellow-400 text-lg">📊 Resultados da Diligência</h4>
                                    
                                    {/* Mandados e Prisões */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-300 mb-2">MP Cumpridos</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.mpCumpridos || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, mpCumpridos: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">MP Diligenciados</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.mpDiligenciados || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, mpDiligenciados: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">Flagrante</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.flagrante || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, flagrante: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">Busca Cumpridos</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.buscaCumpridos || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, buscaCumpridos: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">MBA Diligenciados</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.mbaDiligenciados || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, mbaDiligenciados: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">Medidas Cautelares</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={informacoes.medidasCautelares || 0}
                                                onChange={(e) => setInformacoes({ ...informacoes, medidasCautelares: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Apreensões */}
                                    <div className="pt-4 border-t border-gray-600">
                                        <h5 className="font-semibold text-white mb-3">🔒 Apreensões</h5>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-300 mb-2">Celulares</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={informacoes.qtdCelular || 0}
                                                    onChange={(e) => setInformacoes({ ...informacoes, qtdCelular: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">Veículos</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={informacoes.qtdVeiculo || 0}
                                                    onChange={(e) => setInformacoes({ ...informacoes, qtdVeiculo: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">Munições</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={informacoes.qtdMunicoes || 0}
                                                    onChange={(e) => setInformacoes({ ...informacoes, qtdMunicoes: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">Armas</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={informacoes.qtdArma || 0}
                                                    onChange={(e) => setInformacoes({ ...informacoes, qtdArma: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">Dinheiro (R$)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={informacoes.dinheiro || 0}
                                                    onChange={(e) => setInformacoes({ ...informacoes, dinheiro: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 mb-2">Droga</label>
                                                <input
                                                    type="text"
                                                    value={informacoes.droga || ''}
                                                    onChange={(e) => setInformacoes({ ...informacoes, droga: e.target.value })}
                                                    placeholder="Ex: 5kg cocaína"
                                                    className="w-full bg-gray-600 text-white rounded px-4 py-2 border border-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2 font-semibold">Observações da Diligência (Tempo Real)</label>
                                    <textarea
                                        value={informacoes.observacoes}
                                        onChange={(e) => setInformacoes({ ...informacoes, observacoes: e.target.value })}
                                        placeholder="Descreva detalhes importantes, características observadas, situação no momento, etc."
                                        className="w-full bg-gray-700 text-white rounded px-4 py-3 border border-gray-600 focus:border-red-500 focus:outline-none h-32 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Botões */}
                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEnviarInformacoes}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-semibold transition-colors flex items-center space-x-2"
                                >
                                    <Send size={18} />
                                    <span>Enviar Informações</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
