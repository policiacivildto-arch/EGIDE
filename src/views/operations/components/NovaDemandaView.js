import React from 'react';
import { FileText, Plus } from 'lucide-react';

export function NovaDemandaView({ formData, setFormData, handleSubmit, showNotification }) {
    const tiposPenais = ['Homicídio', 'Tráfico de Drogas', 'ORCRIM / Lavagem de Dinheiro', 'Roubo', 'Furto', 'Outros'];
    const aisList = Array.from({ length: 25 }, (_, i) => `AIS ${i + 1}`);
    const faccoesList = ['CV', 'GDE', 'Neutros', 'PCC', 'TCP', 'Outros'];
    const alvosSensiveisList = ['Mulher', 'Policial', 'Político', 'Advogado', 'Servidor Público', 'Outros'];
    const orgaosApoio = ['MP', 'Polícia Militar', 'Polícia Federal', 'Polícia Rodoviária Federal', 'Receita Federal', 'SEFAZ', 'AMC', 'Guarda Municipal'];

    const addBriefingLocal = () => {
        setFormData({ ...formData, locais_briefing: [...formData.locais_briefing, ''] });
    };

    const updateBriefingLocal = (index, value) => {
        const newLocais = [...formData.locais_briefing];
        newLocais[index] = value;
        setFormData({ ...formData, locais_briefing: newLocais });
    };

    const toggleCheckbox = (field, value) => {
        const current = formData[field];
        const newValue = current.includes(value) 
            ? current.filter(v => v !== value)
            : [...current, value];
        setFormData({ ...formData, [field]: newValue });
    };

    const calcularProjecao = () => {
        const totalDPC = formData.apoio_operacional_dpc + formData.apoio_cartorario_dpc + formData.efetivo_interno_dpc + (formData.precisa_apoio_dto ? formData.dto_apoio_dpc : 0);
        const totalOIP = formData.apoio_operacional_oip + formData.apoio_cartorario_oip + formData.efetivo_interno_oip + (formData.precisa_apoio_dto ? formData.dto_apoio_oip : 0);
        const custoEstimado = (totalDPC * 500) + (totalOIP * 100); // Valores fictícios
        return { totalDPC, totalOIP, custoEstimado };
    };

    const { totalDPC, totalOIP, custoEstimado } = calcularProjecao();

    return (
        <div className="bg-gray-700 p-6 rounded-lg max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <FileText size={28} />
                <span>📋 Formulário — Cadastro de Operação Policial</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Dados Gerais */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">1. Dados Gerais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Nome da Operação *</label>
                            <input
                                type="text"
                                required
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: Operação Cerco"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Órgão Solicitante *</label>
                            <select
                                required
                                value={formData.orgao_solicitante}
                                onChange={(e) => setFormData({ ...formData, orgao_solicitante: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="">Selecione um Órgão</option>
                                <option value="DRE">DRE</option>
                                <option value="DHPP">DHPP</option>
                                <option value="DRFR">DRFR</option>
                                <option value="DTO">DTO</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Delegacia Responsável</label>
                            <input
                                type="text"
                                value={formData.delegacia_responsavel}
                                onChange={(e) => setFormData({ ...formData, delegacia_responsavel: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Data de Início *</label>
                            <input
                                type="date"
                                required
                                value={formData.data_inicio}
                                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Hora de Início Padrão</label>
                            <input
                                type="time"
                                value={formData.hora_inicio}
                                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Hora de Fim Padrão</label>
                            <input
                                type="time"
                                value={formData.hora_fim}
                                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Status DTO</label>
                            <select
                                value={formData.status_dto}
                                onChange={(e) => setFormData({ ...formData, status_dto: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="Aguardando Análise DTO">Aguardando Análise DTO</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Aprovada">Aprovada</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* 2. Objetivo */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">2. Objetivo da Operação</h3>
                    <textarea
                        value={formData.objetivo}
                        onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                        rows={4}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                        placeholder="Descrever os principais objetivos..."
                    />
                </section>

                {/* 3. Locais de Briefing */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">3. Local(is) do Briefing</h3>
                    {formData.locais_briefing.map((local, index) => (
                        <input
                            key={index}
                            type="text"
                            value={local}
                            onChange={(e) => updateBriefingLocal(index, e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 mb-2"
                            placeholder={`Local ${index + 1}`}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={addBriefingLocal}
                        className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white mt-2"
                    >
                        + Adicionar Local de Briefing
                    </button>
                </section>

                {/* 4. Efetivo Solicitado e Apoio DTO */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">4. Efetivo Solicitado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Quantidade de OIP (Interno)</label>
                            <input
                                type="number"
                                min={0}
                                value={formData.efetivo_interno_oip}
                                onChange={(e) => setFormData({ ...formData, efetivo_interno_oip: Number(e.target.value) })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Quantidade de DPC (Interno)</label>
                            <input
                                type="number"
                                min={0}
                                value={formData.efetivo_interno_dpc}
                                onChange={(e) => setFormData({ ...formData, efetivo_interno_dpc: Number(e.target.value) })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="inline-flex items-center text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={formData.precisa_apoio_dto}
                                    onChange={(e) => setFormData({ ...formData, precisa_apoio_dto: e.target.checked })}
                                    className="mr-2"
                                />
                                Precisa de apoio do DTO (externo)?
                            </label>
                        </div>

                        {formData.precisa_apoio_dto && (
                            <>
                                <div>
                                    <label className="block text-gray-300 mb-2">Quantidade de OIP (DTO / Externo)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.dto_apoio_oip}
                                        onChange={(e) => setFormData({ ...formData, dto_apoio_oip: Number(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Quantidade de DPC (DTO / Externo)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.dto_apoio_dpc}
                                        onChange={(e) => setFormData({ ...formData, dto_apoio_dpc: Number(e.target.value) })}
                                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* 8. Projeção Automática */}
                <section className="bg-gradient-to-r from-cyan-600 to-teal-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">8. Projeção de Efetivo e Custos (Automático)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Total de DPCs Previstos:</p>
                            <p className="text-3xl font-bold text-white">{totalDPC}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Total de OIPs Previstos:</p>
                            <p className="text-3xl font-bold text-white">{totalOIP}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Custo Estimado da Operação:</p>
                            <p className="text-3xl font-bold text-white">
                                R$ {custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="submit"
                        className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg text-white font-semibold"
                    >
                        Salvar Operação
                    </button>
                </div>
            </form>
        </div>
    );
}
