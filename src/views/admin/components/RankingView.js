import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../config/api';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { ChevronDown, X } from 'lucide-react';

const CRITERIA = [
    { key: 'prisoes', label: '🔗 Total de Prisões' },
    { key: 'participacoes', label: '👮 Total de Serviços' },
    { key: 'abordagensPessoas', label: '👥 Pessoas Abordadas' },
    { key: 'abordagensVeiculos', label: '🚗 Veículos Abordados' },
];

const getRankLabel = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
};

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
};

const normalizeOfficer = (raw) => ({
    id: raw?.id ?? raw?.policial_id ?? raw?.user_id ?? raw?.matricula,
    nome: raw?.nome || raw?.name || raw?.policial_nome || raw?.username || 'N/A',
    matricula: raw?.matricula || raw?.policial_matricula || 'N/A',
});

const getMetricValue = (raw, criterionKey) => {
    const keyMap = {
        prisoes: ['prisoes', 'prisoes', 'total_prisoes', 'total', 'valor', 'score'],
        participacoes: ['participacoes', 'total_servicos', 'servicos', 'total', 'valor', 'score'],
        abordagensPessoas: ['abordagensPessoas', 'abordagens_pessoas', 'pessoas', 'total', 'valor', 'score'],
        abordagensVeiculos: ['abordagensVeiculos', 'abordagens_veiculos', 'veiculos', 'total', 'valor', 'score'],
    };

    const keys = keyMap[criterionKey] || [];
    for (const key of keys) {
        const value = raw?.[key];
        if (typeof value === 'number') return value;
    }
    return 0;
};

export const RankingView = ({ showNotification, departamento }) => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCriteria, setSelectedCriteria] = useState('prisoes'); // Padrão: Prisões
    const [selectedOfficer, setSelectedOfficer] = useState(null);

    // Carrega dados do ranking
    useEffect(() => {
        const loadRanking = async () => {
            setLoading(true);
            try {
                const criterionRequests = CRITERIA.map(async ({ key }) => {
                    const result = await apiClient.getRankings(key, 'geral', {}, departamento || '');
                    return { key, rows: toArray(result) };
                });

                const settled = await Promise.allSettled(criterionRequests);
                const successful = settled
                    .filter((item) => item.status === 'fulfilled')
                    .map((item) => item.value)
                    .filter((item) => item.rows.length > 0);

                const rankingMap = new Map();
                successful.forEach(({ key, rows }) => {
                    rows.forEach((row) => {
                        const normalized = normalizeOfficer(row);
                        const mapKey = String(normalized.matricula || normalized.id);
                        if (!rankingMap.has(mapKey)) {
                            rankingMap.set(mapKey, {
                                id: normalized.id,
                                nome: normalized.nome,
                                matricula: normalized.matricula,
                                prisoes: 0,
                                participacoes: 0,
                                abordagensPessoas: 0,
                                abordagensVeiculos: 0,
                            });
                        }

                        const current = rankingMap.get(mapKey);
                        current[key] = getMetricValue(row, key);
                    });
                });

                if (rankingMap.size > 0) {
                    setRanking(Array.from(rankingMap.values()));
                    return;
                }

                const policiaisRaw = await apiClient.getPoliciais();
                const policiais = toArray(policiaisRaw).map((officer) => ({
                    id: officer.id,
                    nome: officer.nome || officer.username || 'N/A',
                    matricula: officer.matricula || 'N/A',
                    prisoes: 0,
                    participacoes: 0,
                    abordagensPessoas: 0,
                    abordagensVeiculos: 0,
                }));
                setRanking(policiais);
            } catch (error) {
                console.error('Erro ao carregar ranking:', error);
                showNotification('Erro ao carregar dados de ranking', 'error');
                setRanking([]);
            } finally {
                setLoading(false);
            }
        };

        loadRanking();
    }, [departamento, showNotification]);

    // Ordena os dados conforme o critério selecionado
    const sortedRanking = useMemo(() => {
        const sorted = [...ranking];
        sorted.sort((a, b) => (b[selectedCriteria] || 0) - (a[selectedCriteria] || 0));
        return sorted;
    }, [ranking, selectedCriteria]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-blue-400">Ranking de Prisões</h2>
                
                {/* Menu Suspenso - Seletor de Critério */}
                <div className="relative">
                    <select
                        value={selectedCriteria}
                        onChange={(e) => setSelectedCriteria(e.target.value)}
                        className="appearance-none px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white font-semibold hover:border-blue-400 transition-colors cursor-pointer"
                    >
                        {CRITERIA.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Informação do Critério Exibido */}
            <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">
                    Exibindo: <span className="font-semibold text-blue-400">
                        {CRITERIA.find(c => c.key === selectedCriteria)?.label}
                    </span>
                </p>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full">
                    <thead className="bg-gray-800 border-b border-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">🥇 Pos.</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Nome</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Matrícula</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-blue-400">
                                {CRITERIA.find(c => c.key === selectedCriteria)?.label}
                            </th>
                        </tr>
                    </thead>
                    
                    <tbody>
                        {sortedRanking.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                                    Nenhum dado disponível
                                </td>
                            </tr>
                        ) : (
                            sortedRanking.map((officer, index) => (
                                <tr 
                                    key={officer.id} 
                                    onClick={() => setSelectedOfficer(officer)}
                                    className="border-b border-gray-700 hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-transparent transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-center text-lg font-bold">
                                        {getRankLabel(index)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-200 font-medium">{officer.nome}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400">{officer.matricula}</td>
                                    <td className="px-4 py-3 text-center text-lg font-bold text-green-400">
                                        {officer[selectedCriteria] || 0}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cards Resumo */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 p-4 rounded-lg border border-yellow-700">
                    <p className="text-xs text-gray-400 mb-1">🏆 Campeão</p>
                    <p className="text-lg font-bold text-yellow-400">{sortedRanking[0]?.nome || '-'}</p>
                    <p className="text-2xl font-bold text-yellow-300 mt-1">{sortedRanking[0]?.[selectedCriteria] || 0}</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">📊 Total Geral</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {sortedRanking.reduce((sum, o) => sum + (o[selectedCriteria] || 0), 0)}
                    </p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">📈 Média</p>
                    <p className="text-2xl font-bold text-green-400">
                        {sortedRanking.length > 0 
                            ? (sortedRanking.reduce((sum, o) => sum + (o[selectedCriteria] || 0), 0) / sortedRanking.length).toFixed(1)
                            : '0'
                        }
                    </p>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedOfficer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-gray-700">
                        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-blue-400">Detalhes do Policial</h3>
                            <button
                                onClick={() => setSelectedOfficer(null)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                <p className="text-sm text-gray-400 mb-1">Nome</p>
                                <p className="text-2xl font-bold text-white mb-4">{selectedOfficer.nome}</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Matrícula</p>
                                        <p className="text-lg font-semibold text-blue-300">{selectedOfficer.matricula}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">ID</p>
                                        <p className="text-lg font-semibold text-gray-300">{selectedOfficer.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {CRITERIA.map((criterion) => {
                                    const allValues = ranking.map((r) => Number(r[criterion.key] || 0));
                                    const avgValue = allValues.length > 0
                                        ? allValues.reduce((a, b) => a + b, 0) / allValues.length
                                        : 0;
                                    const value = Number(selectedOfficer[criterion.key] || 0);
                                    const difference = value - avgValue;
                                    const isAbove = difference > 0;

                                    return (
                                        <div key={criterion.key} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                            <p className="text-xs text-gray-400 mb-2">{criterion.label}</p>
                                            <p className="text-2xl font-bold text-blue-400">{value}</p>
                                            <p className="text-xs text-gray-500 mt-1">Média: {avgValue.toFixed(2)}</p>
                                            <p className={`text-xs font-semibold mt-1 ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
                                                {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};