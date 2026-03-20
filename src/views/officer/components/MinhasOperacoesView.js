import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import { Modal, LoadingSpinner } from '../../../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { displayMatricula } from '../../../utils/helpers';

const MOCK_PROFILE_EMAIL = 'kleverdpc@gmail.com';

const createMockConvoyForProfile = () => ({
    id: 'mock-convoy-kleverdpc',
    numeroComboio: 'MOCK-01',
    date: '2026-02-20',
    ais: 'AIS 5',
    bairros: ['Centro', 'Aldeota'],
});

const createMockConvoyToFillForProfile = () => ({
    id: 'mock-convoy-kleverdpc-fill',
    numeroComboio: 'MOCK-02',
    date: '2026-02-21',
    ais: 'AIS 6',
    bairros: ['Parangaba', 'Maraponga'],
});

const createMockReportForProfile = (user) => ({
    id: 'mock-report-kleverdpc',
    convoyId: 'mock-convoy-kleverdpc',
    submittedAt: new Date().toISOString(),
    cycleId: getCycleId(),
    departamento: user?.departamento || 'DPO',
    delegacia: user?.delegacia || 'DTO',
    procedimentoEscolta: '2026/000001',
    homicidiosAIS: false,
    abordagens: { pessoas: 12, veiculos: 4 },
    prisoes: [{ tipo: 'Prisões', quantidade: 1 }],
    procedimentos: { boc: 2, tco: 1, apf: 1 },
    apreensoes: {
        celulares: 3,
        veiculos: 1,
        armas: [{ tipo: 'Armas', quantidade: 1 }],
        municoes: [{ tipo: 'Munições', quantidade: 18 }],
        drogas: [{ tipo: 'Drogas', quantidade: 2 }],
        outros: 'Mock de visualização para perfil sem operações reais.',
    },
});

const getCycleId = (date = new Date()) => {
    const day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (day > 20) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
    return `${year}-${String(month).padStart(2, '0')}`;
};

const buildLegacyTeamCardId = (teamId) => `legacy-team-${teamId}`;

const toLegacyOperationDateTime = (rawDate) => {
    if (!rawDate) return new Date().toISOString();

    if (typeof rawDate === 'string') {
        const isoDateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawDate);
        if (isoDateMatch) {
            return `${isoDateMatch[1]}T12:00:00`;
        }

        const parsedDate = new Date(rawDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }

    if (rawDate?.seconds) {
        return new Date(rawDate.seconds * 1000).toISOString();
    }

    return new Date().toISOString();
};

const toLegacyStoredReport = (storedValue, fallbackData = {}) => {
    if (!storedValue) return null;

    try {
        const parsed = JSON.parse(storedValue);
        if (parsed && typeof parsed === 'object') {
            return {
                ...parsed,
                id: parsed.id || `legacy-report-${fallbackData.legacyOperationId || fallbackData.legacyTeamId || 'sem-id'}`,
                convoyId: fallbackData.cardId || parsed.convoyId,
                departamento: parsed.departamento || fallbackData.departamento || 'N/A',
                delegacia: parsed.delegacia || fallbackData.delegacia || 'N/A',
                ais: parsed.ais || fallbackData.ais || '',
                bairros: Array.isArray(parsed.bairros) ? parsed.bairros : (fallbackData.bairros || []),
            };
        }
    } catch {
        return {
            id: `legacy-report-${fallbackData.legacyOperationId || fallbackData.legacyTeamId || 'sem-id'}`,
            convoyId: fallbackData.cardId,
            submittedAt: new Date().toISOString(),
            cycleId: getCycleId(),
            departamento: fallbackData.departamento || 'N/A',
            delegacia: fallbackData.delegacia || 'N/A',
            procedimentoEscolta: '',
            homicidiosAIS: null,
            abordagens: { pessoas: 0, veiculos: 0, motocicletas: 0, bicicletas: 0 },
            mandadosPrisaoDiligenciados: 0,
            prisoes: [],
            conducoesAveriguacao: 0,
            escoltas: [],
            procedimentos: { boc: [], tco: [], apf: [], bocTotal: 0, tcoTotal: 0, apfTotal: 0 },
            apreensoes: {
                celulares: 0,
                valores: 0,
                veiculos: 0,
                motocicletas: 0,
                armas: [],
                municoes: [],
                drogas: [],
                outros: String(storedValue || ''),
            },
            ais: fallbackData.ais || '',
            bairros: fallbackData.bairros || [],
            submittedBy: {
                nome: fallbackData.nome || '',
                matricula: fallbackData.matricula || '',
                email: fallbackData.email || '',
            }
        };
    }

    return null;
};

const OperationReportForm = ({ convoy, user, onSubmit, onCancel }) => {
    const [form, setForm] = useState({
        procedimentoEscolta: '',
        homicidiosAIS: '',
        abordagensPessoas: '',
        abordagensVeiculos: '',
        abordagensMotocicletas: '',
        abordagensBicicletas: '',
        mandadosDiligenciados: '',
        conducoesAveriguacao: '',
        procedimentoBocNumero: '',
        procedimentoTcoNumero: '',
        procedimentoApfNumero: '',
        procedimentosBocList: [],
        procedimentosTcoList: [],
        procedimentosApfList: [],
        apreensoesCelulares: '',
        apreensoesValores: '',
        apreensoesVeiculos: '',
        apreensoesMotocicletas: '',
        apreensoesOutros: '',
        armaTipo: '',
        armaQuantidade: '1',
        armasList: [],
        municaoTipo: '',
        municaoQuantidade: '1',
        municoesList: [],
        drogaTipo: '',
        drogaQuantidade: '1',
        drogasList: [],
        prisaoTipo: '',
        prisaoQuantidade: '1',
        prisoesList: [],
        escoltaDescricao: '',
        escoltaQuantidade: '1',
        escoltasList: []
    });

    const toNumber = (value) => (value === '' || value === null || value === undefined ? 0 : Number(value));

    const addListItem = (listField, item) => {
        if (!item || !item.tipo) return false;
        setForm((prev) => ({
            ...prev,
            [listField]: [...(prev[listField] || []), item],
        }));
        return true;
    };

    const removeListItem = (listField, indexToRemove) => {
        setForm((prev) => ({
            ...prev,
            [listField]: (prev[listField] || []).filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const reportData = {
            convoyId: convoy.id,
            source: convoy.source,
            legacyTeamId: convoy.legacyTeamId || null,
            legacyOperationId: convoy.legacyOperationId || null,
            operationDate: convoy.rawDate || convoy.date,
            submittedAt: new Date(),
            cycleId: getCycleId(),
            departamento: user?.departamento || user?.departamento_nome || '',
            delegacia: user?.delegacia || user?.delegacia_nome || '',
            procedimentoEscolta: form.procedimentoEscolta || '',
            homicidiosAIS: form.homicidiosAIS === 'sim' ? true : form.homicidiosAIS === 'nao' ? false : null,
            abordagens: {
                pessoas: toNumber(form.abordagensPessoas),
                veiculos: toNumber(form.abordagensVeiculos),
                motocicletas: toNumber(form.abordagensMotocicletas),
                bicicletas: toNumber(form.abordagensBicicletas)
            },
            mandadosPrisaoDiligenciados: toNumber(form.mandadosDiligenciados),
            prisoes: form.prisoesList || [],
            conducoesAveriguacao: toNumber(form.conducoesAveriguacao),
            escoltas: form.escoltasList || [],
            procedimentos: {
                boc: form.procedimentosBocList || [],
                tco: form.procedimentosTcoList || [],
                apf: form.procedimentosApfList || [],
                bocTotal: (form.procedimentosBocList || []).length,
                tcoTotal: (form.procedimentosTcoList || []).length,
                apfTotal: (form.procedimentosApfList || []).length,
            },
            apreensoes: {
                celulares: toNumber(form.apreensoesCelulares),
                valores: toNumber(form.apreensoesValores),
                veiculos: toNumber(form.apreensoesVeiculos),
                motocicletas: toNumber(form.apreensoesMotocicletas),
                armas: form.armasList || [],
                municoes: form.municoesList || [],
                drogas: form.drogasList || [],
                outros: form.apreensoesOutros || ''
            },
            ais: convoy.ais || '',
            bairros: Array.isArray(convoy.bairros) ? convoy.bairros : [],
            submittedBy: {
                nome: user?.nome || '',
                matricula: user?.matricula || '',
                email: user?.email || ''
            }
        };
        onSubmit(reportData);
    };

    return (
        <Modal onClose={onCancel} size="5xl" contentClassName="bg-gray-900 border border-gray-700 p-0">
            <div className="p-6 text-white bg-gray-900 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4">Preencher Relatório</h3>
                <p className="text-sm text-gray-400 mb-6">Comboio {convoy.numeroComboio || ''} - {(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-cyan-300 mb-6">Relatório de Resultado da Operação | Data: {(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')} | AIS: {convoy.ais || 'N/A'}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Número do procedimento (escolta de preso)</label>
                            <input
                                type="text"
                                value={form.procedimentoEscolta}
                                onChange={(e) => setForm(prev => ({ ...prev, procedimentoEscolta: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                placeholder="Ex: 2026/000123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Homicídios na AIS de atuação</label>
                            <select
                                value={form.homicidiosAIS}
                                onChange={(e) => setForm(prev => ({ ...prev, homicidiosAIS: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                            >
                                <option value="">Selecione</option>
                                <option value="sim">Sim</option>
                                <option value="nao">Não</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">1. Abordagens</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Pessoas</label>
                                <input
                                    type="number"
                                    value={form.abordagensPessoas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensPessoas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Veículos</label>
                                <input
                                    type="number"
                                    value={form.abordagensVeiculos}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensVeiculos: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Motocicletas</label>
                                <input
                                    type="number"
                                    value={form.abordagensMotocicletas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensMotocicletas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Bicicletas</label>
                                <input
                                    type="number"
                                    value={form.abordagensBicicletas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensBicicletas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
                        <h4 className="text-lg font-semibold text-cyan-300">2. Apreensões</h4>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Armas de Fogo</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.armaTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, armaTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Tipo</option>
                                    <option value="Pistola">Pistola</option>
                                    <option value="Revolver">Revólver</option>
                                    <option value="Espingarda">Espingarda</option>
                                    <option value="Fuzil">Fuzil</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.armaQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, armaQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addListItem('armasList', { tipo: form.armaTipo, quantidade: toNumber(form.armaQuantidade || 1) });
                                        setForm(prev => ({ ...prev, armaTipo: '', armaQuantidade: '1' }));
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Arma
                                </button>
                            </div>
                            {form.armasList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.armasList.map((item, index) => (
                                        <div key={`arma-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('armasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Munições</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.municaoTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, municaoTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Calibre</option>
                                    <option value="9mm">9mm</option>
                                    <option value=".40">.40</option>
                                    <option value="380">380</option>
                                    <option value="12">12</option>
                                    <option value="5.56">5.56</option>
                                    <option value="7.62">7.62</option>
                                    <option value="38">38</option>
                                    <option value="32">32</option>
                                    <option value="22">22</option>
                                    <option value=".50">.50</option>
                                    <option value=".30">.30</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.municaoQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, municaoQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const added = addListItem('municoesList', { tipo: form.municaoTipo, quantidade: toNumber(form.municaoQuantidade || 1) });
                                        if (added) {
                                            setForm(prev => ({ ...prev, municaoTipo: '', municaoQuantidade: '1' }));
                                        }
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Munição
                                </button>
                            </div>
                            {form.municoesList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.municoesList.map((item, index) => (
                                        <div key={`municao-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('municoesList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Drogas</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.drogaTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, drogaTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Tipo de Droga</option>
                                    <option value="MACONHA">MACONHA</option>
                                    <option value="HAXIXE">HAXIXE</option>
                                    <option value="SKANK">SKANK</option>
                                    <option value="COCAINA">COCAINA</option>
                                    <option value="HEROINA">HEROINA</option>
                                    <option value="CRACK">CRACK</option>
                                    <option value="LSD">LSD</option>
                                    <option value="ECSTASY">ECSTASY</option>
                                    <option value="ANFETAMINA">ANFETAMINA</option>
                                    <option value="ANABOLIZANTE">ANABOLIZANTE</option>
                                    <option value="MEDICAMENTOS">MEDICAMENTOS</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.drogaQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, drogaQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const added = addListItem('drogasList', { tipo: form.drogaTipo, quantidade: toNumber(form.drogaQuantidade || 1) });
                                        if (added) {
                                            setForm(prev => ({ ...prev, drogaTipo: '', drogaQuantidade: '1' }));
                                        }
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Droga
                                </button>
                            </div>
                            {form.drogasList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.drogasList.map((item, index) => (
                                        <div key={`droga-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('drogasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Celulares</label>
                                <input type="number" value={form.apreensoesCelulares} onChange={(e) => setForm(prev => ({ ...prev, apreensoesCelulares: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Valores (R$)</label>
                                <input type="number" value={form.apreensoesValores} onChange={(e) => setForm(prev => ({ ...prev, apreensoesValores: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Veículos</label>
                                <input type="number" value={form.apreensoesVeiculos} onChange={(e) => setForm(prev => ({ ...prev, apreensoesVeiculos: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Motocicletas</label>
                                <input type="number" value={form.apreensoesMotocicletas} onChange={(e) => setForm(prev => ({ ...prev, apreensoesMotocicletas: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">3. Mandados de Prisão diligênciados</h4>
                        <label className="block text-sm text-gray-300 mb-2">Quantidade</label>
                        <input type="number" value={form.mandadosDiligenciados} onChange={(e) => setForm(prev => ({ ...prev, mandadosDiligenciados: e.target.value }))} className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">4. Prisões</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select
                                value={form.prisaoTipo}
                                onChange={(e) => setForm(prev => ({ ...prev, prisaoTipo: e.target.value }))}
                                className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                            >
                                <option value="">Selecione o tipo</option>
                                <option value="FLAGRANTE">FLAGRANTE</option>
                                <option value="PRISÃO PREVENTIVA">PRISÃO PREVENTIVA</option>
                                <option value="PRISÃO TEMPORÁRIA">PRISÃO TEMPORÁRIA</option>
                                <option value="ATO INFRACIONAL">ATO INFRACIONAL</option>
                                <option value="MBA ADOLESCENTE">MBA ADOLESCENTE</option>
                                <option value="PRISÃO DEFINITIVA">PRISÃO DEFINITIVA</option>
                            </select>
                            <input type="number" value={form.prisaoQuantidade} onChange={(e) => setForm(prev => ({ ...prev, prisaoQuantidade: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="1" />
                            <button
                                type="button"
                                onClick={() => {
                                    const added = addListItem('prisoesList', { tipo: form.prisaoTipo, quantidade: toNumber(form.prisaoQuantidade || 1) });
                                    if (added) {
                                        setForm(prev => ({ ...prev, prisaoTipo: '', prisaoQuantidade: '1' }));
                                    }
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                            >
                                Adicionar Prisão
                            </button>
                        </div>
                        {form.prisoesList.length > 0 && (
                            <div className="mt-2 space-y-1 text-sm text-gray-200">
                                {form.prisoesList.map((item, index) => (
                                    <div key={`prisao-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                        <span>{item.tipo} - {item.quantidade}</span>
                                        <button type="button" onClick={() => removeListItem('prisoesList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">5. Conduções para Averiguação</h4>
                        <label className="block text-sm text-gray-300 mb-2">Quantidade</label>
                        <input type="number" value={form.conducoesAveriguacao} onChange={(e) => setForm(prev => ({ ...prev, conducoesAveriguacao: e.target.value }))} className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">6. Escolta de Presos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input type="text" value={form.escoltaDescricao} onChange={(e) => setForm(prev => ({ ...prev, escoltaDescricao: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" placeholder="Descrição da escolta" />
                            <input type="number" value={form.escoltaQuantidade} onChange={(e) => setForm(prev => ({ ...prev, escoltaQuantidade: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="1" />
                            <button
                                type="button"
                                onClick={() => {
                                    const added = addListItem('escoltasList', { tipo: form.escoltaDescricao || 'Escolta', quantidade: toNumber(form.escoltaQuantidade || 1) });
                                    if (added) {
                                        setForm(prev => ({ ...prev, escoltaDescricao: '', escoltaQuantidade: '1' }));
                                    }
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                            >
                                Adicionar Escolta
                            </button>
                        </div>
                        {form.escoltasList.length > 0 && (
                            <div className="mt-2 space-y-1 text-sm text-gray-200">
                                {form.escoltasList.map((item, index) => (
                                    <div key={`escolta-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                        <span>{item.tipo} - {item.quantidade}</span>
                                        <button type="button" onClick={() => removeListItem('escoltasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">7. Homicídio na AIS de Atuação</h4>
                        <select
                            value={form.homicidiosAIS}
                            onChange={(e) => setForm(prev => ({ ...prev, homicidiosAIS: e.target.value }))}
                            className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                        >
                            <option value="">Selecione</option>
                            <option value="sim">Sim</option>
                            <option value="nao">Não</option>
                        </select>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">Procedimentos (número)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">BOC</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoBocNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoBocNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do BOC"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoBocNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosBocList: [...(prev.procedimentosBocList || []), value],
                                                procedimentoBocNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosBocList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosBocList.map((item, index) => (
                                            <div key={`boc-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosBocList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">TCO</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoTcoNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoTcoNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do TCO"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoTcoNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosTcoList: [...(prev.procedimentosTcoList || []), value],
                                                procedimentoTcoNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosTcoList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosTcoList.map((item, index) => (
                                            <div key={`tco-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosTcoList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">APF</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoApfNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoApfNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do APF"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoApfNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosApfList: [...(prev.procedimentosApfList || []), value],
                                                procedimentoApfNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosApfList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosApfList.map((item, index) => (
                                            <div key={`apf-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosApfList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-600 text-white">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enviar Relatório</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const ViewReport = ({ report, onClose }) => (
    <Modal onClose={onClose} size="3xl" contentClassName="bg-gray-900 border border-gray-700 p-0">
        <div className="p-6 text-white bg-gray-900 rounded-xl border border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-blue-300">Relatório Enviado</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Departamento</p>
                    <p className="text-white font-semibold">{report.departamento || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Delegacia</p>
                    <p className="text-white font-semibold">{report.delegacia || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Procedimento (escolta)</p>
                    <p className="text-white font-semibold">{report.procedimentoEscolta || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Homicídios na AIS</p>
                    <p className="text-white font-semibold">{report.homicidiosAIS === true ? 'Sim' : report.homicidiosAIS === false ? 'Não' : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Prisões</p>
                    <p className="text-white font-semibold">{report.prisoes?.reduce((sum, p) => sum + (Number(p.quantidade) || 0), 0) || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Abordagens</p>
                    <p className="text-white font-semibold">
                        {report.abordagens?.pessoas || 0} pessoas / {report.abordagens?.veiculos || 0} veículos / {report.abordagens?.motocicletas || 0} motos / {report.abordagens?.bicicletas || 0} bicicletas
                    </p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Procedimentos</p>
                    <p className="text-white font-semibold">
                        BOC {Array.isArray(report.procedimentos?.boc) ? report.procedimentos?.boc.length : (report.procedimentos?.bocTotal || Number(report.procedimentos?.boc) || 0)} |
                        {' '}TCO {Array.isArray(report.procedimentos?.tco) ? report.procedimentos?.tco.length : (report.procedimentos?.tcoTotal || Number(report.procedimentos?.tco) || 0)} |
                        {' '}APF {Array.isArray(report.procedimentos?.apf) ? report.procedimentos?.apf.length : (report.procedimentos?.apfTotal || Number(report.procedimentos?.apf) || 0)}
                    </p>
                    {Array.isArray(report.procedimentos?.boc) && report.procedimentos.boc.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">BOC: {report.procedimentos.boc.join(', ')}</p>
                    )}
                    {Array.isArray(report.procedimentos?.tco) && report.procedimentos.tco.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">TCO: {report.procedimentos.tco.join(', ')}</p>
                    )}
                    {Array.isArray(report.procedimentos?.apf) && report.procedimentos.apf.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">APF: {report.procedimentos.apf.join(', ')}</p>
                    )}
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Apreensões</p>
                    <p className="text-white font-semibold">Celulares {report.apreensoes?.celulares || 0} | Valores R$ {report.apreensoes?.valores || 0} | Veículos {report.apreensoes?.veiculos || 0} | Motocicletas {report.apreensoes?.motocicletas || 0} | Armas {report.apreensoes?.armas?.reduce((sum, a) => sum + (Number(a.quantidade) || 0), 0) || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Mandados de Prisão diligênciados</p>
                    <p className="text-white font-semibold">{report.mandadosPrisaoDiligenciados || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Conduções para Averiguação</p>
                    <p className="text-white font-semibold">{report.conducoesAveriguacao || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Escoltas de Presos</p>
                    <p className="text-white font-semibold">{Array.isArray(report.escoltas) ? report.escoltas.length : 0} registro(s)</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Outros</p>
                    <p className="text-white font-semibold">{report.apreensoes?.outros || 'N/A'}</p>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Fechar</button>
            </div>
        </div>
    </Modal>
);

export const MinhasOperacoesView = ({ user, showNotification }) => {
    const [myConvoys, setMyConvoys] = useState([]);
    const [reports, setReports] = useState(new Map());
    const [teamByOperation, setTeamByOperation] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    const shouldUseMockProfile = String(user?.email || '').toLowerCase() === MOCK_PROFILE_EMAIL;

    const toList = (payload) => (Array.isArray(payload) ? payload : (payload?.results || []));
    const normalizeMatricula = (value) => String(value || '').replace(/\D/g, '');

    const mapOperationToCard = (operation) => ({
        id: operation.id,
        numeroComboio: operation.nome || `OP-${operation.id}`,
        date: operation.data_hora_inicio,
        ais: operation.departamento_solicitante_sigla || operation.departamento_solicitante_nome || 'N/A',
        bairros: [],
        status: operation.status,
        source: 'operacao-policial',
    });

    const mapLegacyOperationToCard = (operation) => ({
        id: buildLegacyTeamCardId(operation.equipe || operation.id),
        legacyOperationId: operation.id,
        legacyTeamId: operation.equipe || null,
        numeroComboio: `Escala ${operation.id}`,
        date: operation.data_inicio,
        rawDate: operation.data_inicio,
        ais: operation.ais || 'N/A',
        bairros: operation.bairros ? String(operation.bairros).split(',').map((item) => item.trim()).filter(Boolean) : [],
        status: operation.status || 'Registrada',
        source: 'operacao-legada',
        legacyStoredReport: operation.resultado || '',
    });

    const mapLegacyTeamToCard = (team) => ({
        id: buildLegacyTeamCardId(team.id),
        legacyTeamId: team.id,
        legacyOperationId: null,
        numeroComboio: `Escala ${team.vaga || team.vaga_info?.id || team.id}`,
        date: team.vaga_info?.data || null,
        rawDate: team.vaga_info?.data || null,
        ais: team.vaga_info?.delegacia_nome || user?.departamento || 'N/A',
        bairros: [],
        status: team.status || 'Registrada',
        source: 'equipe-legada',
        legacyStoredReport: '',
    });

    const toOperationReport = (operation, resultados, userData) => {
        const report = {
            id: `resultado-op-${operation.id}`,
            convoyId: operation.id,
            submittedAt: new Date().toISOString(),
            cycleId: getCycleId(),
            departamento: userData?.departamento || userData?.departamento_nome || operation.departamento_solicitante_sigla || 'N/A',
            delegacia: userData?.delegacia || userData?.delegacia_nome || 'N/A',
            procedimentoEscolta: '',
            homicidiosAIS: null,
            abordagens: { pessoas: 0, veiculos: 0, motocicletas: 0, bicicletas: 0 },
            mandadosPrisaoDiligenciados: 0,
            prisoes: [],
            conducoesAveriguacao: 0,
            escoltas: [],
            procedimentos: { boc: [], tco: [], apf: [], bocTotal: 0, tcoTotal: 0, apfTotal: 0 },
            apreensoes: {
                celulares: 0,
                valores: 0,
                veiculos: 0,
                motocicletas: 0,
                armas: [],
                municoes: [],
                drogas: [],
                outros: ''
            },
            ais: operation.departamento_solicitante_sigla || '',
            bairros: [],
            submittedBy: {
                nome: userData?.nome || '',
                matricula: userData?.matricula || '',
                email: userData?.email || ''
            }
        };

        resultados.forEach((resultado) => {
            const quantidade = Number(resultado?.quantidade) || 0;
            const tipo = String(resultado?.tipo || '').toLowerCase();
            const descricao = String(resultado?.descricao || '').trim();

            if (tipo === 'prisão' || tipo === 'prisao') {
                report.prisoes.push({ tipo: descricao || 'Prisão', quantidade: quantidade || 1 });
                return;
            }
            if (tipo === 'mandado cumprido') {
                report.mandadosPrisaoDiligenciados += quantidade;
                return;
            }
            if (tipo === 'arma apreendida') {
                report.apreensoes.armas.push({ tipo: descricao || 'Arma', quantidade: quantidade || 1 });
                return;
            }
            if (tipo === 'droga apreendida') {
                report.apreensoes.drogas.push({ tipo: descricao || 'Droga', quantidade: quantidade || 1 });
                return;
            }
            if (tipo === 'veículo recuperado' || tipo === 'veiculo recuperado') {
                report.apreensoes.veiculos += quantidade;
                return;
            }
            if (tipo === 'apreensão' || tipo === 'apreensao') {
                report.apreensoes.outros = report.apreensoes.outros
                    ? `${report.apreensoes.outros}; ${descricao}`
                    : descricao;
                return;
            }

            report.apreensoes.outros = report.apreensoes.outros
                ? `${report.apreensoes.outros}; ${descricao || 'Resultado operacional registrado.'}`
                : (descricao || 'Resultado operacional registrado.');
        });

        return report;
    };

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchMyData = async () => {
            setLoading(true);

            try {
                const queryPolicial = user?.email || user?.username || user?.matricula || '';
                const policiaisBusca = await apiClient.getPoliciais({ search: queryPolicial });
                const policiais = toList(policiaisBusca);
                const userMatricula = normalizeMatricula(user?.matricula);
                const policialAtual = policiais.find((item) => {
                    const itemMatricula = normalizeMatricula(item?.matricula);
                    return (
                        (userMatricula && itemMatricula && (itemMatricula === userMatricula || itemMatricula.endsWith(userMatricula) || userMatricula.endsWith(itemMatricula))) ||
                        (item?.email && user?.email && String(item.email).toLowerCase() === String(user.email).toLowerCase()) ||
                        Number(item?.usuario?.id) === Number(user?.id)
                    );
                });

                let operacoesDataBase = [];
                try {
                    operacoesDataBase = toList(await apiClient.getMinhasOperacoesPoliciais());
                } catch (error) {
                    operacoesDataBase = [];
                }

                let equipesData = [];
                try {
                    equipesData = toList(await apiClient.getEquipesOperacao());
                } catch (error) {
                    console.warn('Endpoint equipes-operacao indisponível, seguindo com fallback legado:', error);
                    equipesData = [];
                }
                const minhasEquipes = !policialAtual ? [] : equipesData.filter((equipe) => {
                    const chefeId = Number(equipe?.chefe);
                    const membros = Array.isArray(equipe?.membros) ? equipe.membros.map((id) => Number(id)) : [];
                    return chefeId === Number(policialAtual.id) || membros.includes(Number(policialAtual.id));
                });

                const idsOperacoesByEquipe = [...new Set(minhasEquipes.map((equipe) => Number(equipe.operacao)).filter((id) => !Number.isNaN(id)))];

                if (operacoesDataBase.length === 0 && idsOperacoesByEquipe.length > 0) {
                    try {
                        const operacoesTodas = toList(await apiClient.getOperacoesPoliciais());
                        operacoesDataBase = operacoesTodas.filter((operacao) => idsOperacoesByEquipe.includes(Number(operacao.id)));
                    } catch (error) {
                        console.warn('Endpoint operacoes-policiais indisponível para fallback por equipe:', error);
                    }
                }

                const idsOperacoes = [...new Set(operacoesDataBase.map((operacao) => Number(operacao.id)).filter((id) => !Number.isNaN(id)))];

                // Fallback legado: operações antigas vinculadas por equipe (módulo SGO clássico)
                let operacoesLegadas = [];
                if (policialAtual) {
                    const equipesLegadas = toList(await apiClient.getTeams());
                    const minhasEquipesLegadas = equipesLegadas.filter((equipe) => {
                        const chefeId = Number(equipe?.chefe);
                        const membros = Array.isArray(equipe?.membros) ? equipe.membros.map((id) => Number(id)) : [];
                        return chefeId === Number(policialAtual.id) || membros.includes(Number(policialAtual.id));
                    });

                    const legacyTeamIds = [...new Set(minhasEquipesLegadas.map((equipe) => Number(equipe.id)).filter((id) => !Number.isNaN(id)))];
                    if (legacyTeamIds.length > 0) {
                        const operacoesAntigas = toList(await apiClient.getOperacoes());
                        const operacoesPorEquipe = new Map(
                            operacoesAntigas
                                .filter((operacao) => legacyTeamIds.includes(Number(operacao?.equipe)))
                                .map((operacao) => [Number(operacao.equipe), operacao])
                        );

                        operacoesLegadas = minhasEquipesLegadas.map((equipe) => {
                            const operacaoRelacionada = operacoesPorEquipe.get(Number(equipe.id));
                            if (operacaoRelacionada) {
                                return mapLegacyOperationToCard(operacaoRelacionada);
                            }

                            return mapLegacyTeamToCard(equipe);
                        });
                    }
                }

                if (idsOperacoes.length === 0 && operacoesLegadas.length === 0) {
                    if (shouldUseMockProfile) {
                        const mockConvoy = createMockConvoyForProfile();
                        const mockConvoyToFill = createMockConvoyToFillForProfile();
                        const mockReport = createMockReportForProfile(user);
                        setMyConvoys([mockConvoyToFill, mockConvoy]);
                        setReports(new Map([[mockConvoy.id, mockReport]]));
                    }
                    setLoading(false);
                    return;
                }

                const teamsMap = new Map();
                idsOperacoes.forEach((operacaoId) => {
                    const equipesDaOperacao = equipesData.filter((equipe) => Number(equipe?.operacao) === Number(operacaoId));
                    const equipePreferencial = policialAtual
                        ? equipesDaOperacao.find((equipe) => {
                            const chefeId = Number(equipe?.chefe);
                            const membros = Array.isArray(equipe?.membros) ? equipe.membros.map((id) => Number(id)) : [];
                            return chefeId === Number(policialAtual.id) || membros.includes(Number(policialAtual.id));
                        })
                        : null;

                    if (equipePreferencial) {
                        teamsMap.set(Number(operacaoId), equipePreferencial);
                    } else if (equipesDaOperacao.length > 0) {
                        teamsMap.set(Number(operacaoId), equipesDaOperacao[0]);
                    }
                });
                setTeamByOperation(teamsMap);

                const minhasOperacoes = operacoesDataBase
                    .map(mapOperationToCard)
                    .concat(operacoesLegadas)
                    .sort((a, b) => {
                        const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date.seconds * 1000);
                        const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date.seconds * 1000);
                        return dateB - dateA;
                    });
                if (minhasOperacoes.length === 0 && shouldUseMockProfile) {
                    const mockConvoy = createMockConvoyForProfile();
                    const mockConvoyToFill = createMockConvoyToFillForProfile();
                    const mockReport = createMockReportForProfile(user);
                    setMyConvoys([mockConvoyToFill, mockConvoy]);
                    setReports(new Map([[mockConvoy.id, mockReport]]));
                    setLoading(false);
                    return;
                }
                setMyConvoys(minhasOperacoes);

                let resultadosData = [];
                try {
                    resultadosData = toList(await apiClient.getResultadosOperacao());
                } catch (error) {
                    console.warn('Endpoint resultados-operacao indisponível, continuando sem relatórios persistidos:', error);
                    resultadosData = [];
                }
                const resultadosDoPolicial = resultadosData.filter((resultado) =>
                    idsOperacoes.includes(Number(resultado?.operacao)) && Number(resultado?.registrado_por) === Number(user?.id)
                );

                const resultadosPorOperacao = new Map();
                resultadosDoPolicial.forEach((resultado) => {
                    const operacaoId = Number(resultado?.operacao);
                    if (!resultadosPorOperacao.has(operacaoId)) {
                        resultadosPorOperacao.set(operacaoId, []);
                    }
                    resultadosPorOperacao.get(operacaoId).push(resultado);
                });

                const reportsMap = new Map();
                minhasOperacoes.forEach((operacao) => {
                    const resultados = resultadosPorOperacao.get(Number(operacao.id)) || [];
                    if (resultados.length > 0) {
                        reportsMap.set(Number(operacao.id), toOperationReport(operacao, resultados, user));
                    }

                    if ((operacao.source === 'operacao-legada' || operacao.source === 'equipe-legada') && operacao.legacyStoredReport) {
                        const legacyReport = toLegacyStoredReport(operacao.legacyStoredReport, {
                            cardId: operacao.id,
                            legacyOperationId: operacao.legacyOperationId,
                            legacyTeamId: operacao.legacyTeamId,
                            departamento: user?.departamento || user?.departamento_nome || '',
                            delegacia: user?.delegacia || user?.delegacia_nome || '',
                            ais: operacao.ais,
                            bairros: operacao.bairros,
                            nome: user?.nome,
                            matricula: user?.matricula,
                            email: user?.email,
                        });

                        if (legacyReport) {
                            reportsMap.set(operacao.id, legacyReport);
                        }
                    }
                });
                setReports(reportsMap);
            } catch (error) {
                console.error('Erro ao carregar dados das operações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyData();
    }, [user, shouldUseMockProfile]);

    const handleOpenForm = (convoy) => setModalContent({ type: 'fillReport', convoy });
    const handleViewReport = (convoy) => setModalContent({ type: 'viewReport', report: reports.get(convoy.id) });
    const handleCloseModal = () => setModalContent(null);

    const handleSubmitReport = async (reportData) => {
        try {
            if (reportData?.source === 'operacao-legada' || reportData?.source === 'equipe-legada') {
                const legacyPayload = {
                    data_inicio: toLegacyOperationDateTime(reportData?.operationDate),
                    equipe: Number(reportData?.legacyTeamId) || null,
                    descricao: `Relatório legado enviado por ${reportData?.submittedBy?.nome || user?.nome || 'policial'}`,
                    status: 'Concluída',
                    ais: reportData?.ais || '',
                    bairros: Array.isArray(reportData?.bairros) ? reportData.bairros.join(', ') : '',
                    resultado: JSON.stringify(reportData),
                };

                let legacyOperationId = Number(reportData?.legacyOperationId) || null;
                if (legacyOperationId) {
                    await apiClient.updateOperacao(legacyOperationId, legacyPayload);
                } else {
                    const createdOperation = await apiClient.createOperacao(legacyPayload);
                    legacyOperationId = Number(createdOperation?.id) || null;
                }

                setReports((prev) => new Map(prev).set(reportData.convoyId, reportData));
                setMyConvoys((prev) => prev.map((item) => (
                    item.id === reportData.convoyId
                        ? {
                            ...item,
                            source: 'operacao-legada',
                            legacyOperationId,
                            legacyStoredReport: JSON.stringify(reportData),
                        }
                        : item
                )));
                showNotification('Relatório legado enviado com sucesso!', 'success');
                handleCloseModal();
                return;
            }

            const operationId = Number(reportData?.convoyId);
            const equipe = teamByOperation.get(operationId);
            const equipeId = equipe?.id || null;
            const payloads = [];

            const totalPrisoes = Array.isArray(reportData?.prisoes)
                ? reportData.prisoes.reduce((acc, item) => acc + (Number(item?.quantidade) || 0), 0)
                : 0;
            if (totalPrisoes > 0) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Prisão',
                    descricao: `Total de prisões registradas: ${totalPrisoes}`,
                    quantidade: totalPrisoes,
                    equipe: equipeId,
                });
            }

            if ((Number(reportData?.mandadosPrisaoDiligenciados) || 0) > 0) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Mandado Cumprido',
                    descricao: 'Mandados de prisão diligenciados',
                    quantidade: Number(reportData.mandadosPrisaoDiligenciados) || 0,
                    equipe: equipeId,
                });
            }

            const totalArmas = Array.isArray(reportData?.apreensoes?.armas)
                ? reportData.apreensoes.armas.reduce((acc, item) => acc + (Number(item?.quantidade) || 0), 0)
                : 0;
            if (totalArmas > 0) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Arma Apreendida',
                    descricao: 'Armas de fogo apreendidas',
                    quantidade: totalArmas,
                    equipe: equipeId,
                });
            }

            const totalDrogas = Array.isArray(reportData?.apreensoes?.drogas)
                ? reportData.apreensoes.drogas.reduce((acc, item) => acc + (Number(item?.quantidade) || 0), 0)
                : 0;
            if (totalDrogas > 0) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Droga Apreendida',
                    descricao: 'Drogas apreendidas',
                    quantidade: totalDrogas,
                    equipe: equipeId,
                });
            }

            if ((Number(reportData?.apreensoes?.veiculos) || 0) > 0) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Veículo Recuperado',
                    descricao: 'Veículos recuperados/apreendidos',
                    quantidade: Number(reportData.apreensoes.veiculos) || 0,
                    equipe: equipeId,
                });
            }

            const totalApreensoesGerais =
                (Number(reportData?.apreensoes?.celulares) || 0) +
                (Number(reportData?.apreensoes?.motocicletas) || 0);
            if (totalApreensoesGerais > 0 || reportData?.apreensoes?.outros) {
                payloads.push({
                    operacao: operationId,
                    tipo: 'Apreensão',
                    descricao: `Celulares: ${Number(reportData?.apreensoes?.celulares) || 0}; Motocicletas: ${Number(reportData?.apreensoes?.motocicletas) || 0}; Outros: ${reportData?.apreensoes?.outros || 'N/A'}`,
                    quantidade: totalApreensoesGerais || 1,
                    equipe: equipeId,
                });
            }

            const resumoAbordagens = `Abordagens - Pessoas: ${Number(reportData?.abordagens?.pessoas) || 0}; Veículos: ${Number(reportData?.abordagens?.veiculos) || 0}; Motocicletas: ${Number(reportData?.abordagens?.motocicletas) || 0}; Bicicletas: ${Number(reportData?.abordagens?.bicicletas) || 0}; Conduções: ${Number(reportData?.conducoesAveriguacao) || 0}; Homicídios AIS: ${reportData?.homicidiosAIS === true ? 'Sim' : reportData?.homicidiosAIS === false ? 'Não' : 'N/A'}`;
            payloads.push({
                operacao: operationId,
                tipo: 'Outro',
                descricao: resumoAbordagens,
                quantidade: 1,
                equipe: equipeId,
            });

            await Promise.all(payloads.map((payload) => apiClient.createResultadoOperacao(payload)));
            showNotification('Relatório enviado com sucesso!', 'success');
            setReports(prev => new Map(prev).set(operationId, reportData));
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            showNotification('Falha ao enviar o relatório.', 'error');
        }
    };

    const renderModal = () => {
        if (!modalContent) return null;
        const { type, convoy, report } = modalContent;
        if (type === 'fillReport') return (
            <OperationReportForm
                convoy={convoy}
                user={user}
                onSubmit={handleSubmitReport}
                onCancel={handleCloseModal}
            />
        );
        if (type === 'viewReport') return <ViewReport report={report} onClose={handleCloseModal} />;
        return null;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            {renderModal()}
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Minhas Operações</h2>
            {myConvoys.length === 0 ? (
                <p className="text-center text-gray-400">Você não participou de nenhuma operação registrada.</p>
            ) : (
                <div className="space-y-4">
                    {myConvoys.map(convoy => {
                        const hasReport = reports.has(convoy.id);
                        return (
                            <div key={convoy.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-blue-400">{`Comboio ${convoy.numeroComboio || ''} - ${(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')}`}</p>
                                    <p className="text-sm text-gray-400">AIS: {convoy.ais} - Bairros: {Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : 'N/A'}</p>
                                </div>
                                {hasReport ? (
                                    <button onClick={() => handleViewReport(convoy)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-2 rounded-lg">Ver Relatório</button>
                                ) : (
                                    <button onClick={() => handleOpenForm(convoy)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Preencher Relatório</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
export default MinhasOperacoesView;
