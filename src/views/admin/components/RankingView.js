// src/views/admin/components/RankingView.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase'; // Import correto!
import { LoadingSpinner } from '../../../components/ui/Shared'; // Import correto!
import { displayMatricula } from '../../../utils/helpers'; // Import correto!

export const RankingView = ({ showNotification, departamento }) => {
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rankingTitle, setRankingTitle] = useState('Ranking Geral de Participação');
    
    // Estados para controlar os filtros
    const [filterType, setFilterType] = useState('geral'); // Opções: 'geral', 'mes', 'periodo'
    // NOVO: Estado para controlar o tipo de ranking
    const [rankingType, setRankingType] = useState('participacoes'); // 'participacoes', 'abordagensPessoas', 'abordagensVeiculos', 'prisoes'
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Formato 'YYYY-MM'
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // ATUALIZADO: A função agora busca dados e calcula os rankings corretamente
const fetchRankingData = async () => {
    setLoading(true);
    setRankingData([]);

    const teamsCollectionRef = collection(db, `/artifacts/${appId}/public/data/teams`);
    const reportsCollectionRef = collection(db, `/artifacts/${appId}/public/data/convoyReports`);
    const convoysCollectionRef = collection(db, `/artifacts/${appId}/public/data/convoys`);
    
    let dateConstraints = [];
    let departamentoConstraint = departamento ? [where("departamento", "==", departamento)] : [];
    let titleDatePart = 'Geral';

    // Monta o filtro de data (sem alterações aqui)
    if (filterType === 'mes') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        dateConstraints = [where("vagaDate", ">=", startOfMonth), where("vagaDate", "<=", endOfMonth)];
        const monthName = startOfMonth.toLocaleString('pt-BR', { month: 'long' });
        titleDatePart = `para ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`;
    } else if (filterType === 'periodo') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateConstraints = [where("vagaDate", ">=", start), where("vagaDate", "<=", end)];
        titleDatePart = `de ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
    }

    try {
        const statsMap = new Map();

        const teamsQuery = query(teamsCollectionRef, ...dateConstraints, ...departamentoConstraint);
        const teamsSnap = await getDocs(teamsQuery);
        const teamsInPeriod = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const teamIdToMembersMap = new Map();
        teamsInPeriod.forEach(team => {
            teamIdToMembersMap.set(team.id, team.members);
            team.members.forEach(member => {
                if (!statsMap.has(member.matricula)) {
                    statsMap.set(member.matricula, {
                        name: member.nome, matricula: member.matricula,
                        participacoes: 0, abordagensPessoas: 0, abordagensVeiculos: 0, prisoes: 0,
                    });
                }
                statsMap.get(member.matricula).participacoes += 1;
            });
        });
        
        const teamIds = teamsInPeriod.map(t => t.id);
        if (teamIds.length > 0) {
            const convoysQuery = query(convoysCollectionRef, where("teamIds", "array-contains-any", teamIds));
            const convoysSnap = await getDocs(convoysQuery);
            const convoyIdToTeamIdsMap = new Map();
            convoysSnap.docs.forEach(doc => convoyIdToTeamIdsMap.set(doc.id, doc.data().teamIds));

            const convoyIdsFromPeriod = [...convoyIdToTeamIdsMap.keys()];
            if (convoyIdsFromPeriod.length > 0) {
                const reportsQuery = query(reportsCollectionRef, where("convoyId", "in", convoyIdsFromPeriod));
                const reportsSnap = await getDocs(reportsQuery);
                const reportsInPeriod = reportsSnap.docs.map(doc => doc.data());

                reportsInPeriod.forEach(report => {
                    const teamIds = convoyIdToTeamIdsMap.get(report.convoyId);
                    if (!teamIds) return;

                    const statsToAdd = {
                        abordagensPessoas: report.abordagens?.pessoas || 0,
                        abordagensVeiculos: report.abordagens?.veiculos || 0,
                        // --- AJUSTE PRINCIPAL AQUI ---
                        // Em vez de somar "quantidade", contamos o número de itens na lista.
                        prisoes: report.prisoes?.length || 0,
                    };

                    teamIds.forEach(teamId => {
                        const members = teamIdToMembersMap.get(teamId);
                        if (members) {
                            members.forEach(member => {
                                if (statsMap.has(member.matricula)) {
                                    const currentStats = statsMap.get(member.matricula);
                                    currentStats.abordagensPessoas += statsToAdd.abordagensPessoas;
                                    currentStats.abordagensVeiculos += statsToAdd.abordagensVeiculos;
                                    currentStats.prisoes += statsToAdd.prisoes;
                                }
                            });
                        }
                    });
                });
            }
        }
        
        // O resto da função (ordenar e definir título) continua igual...
        let sortKey = 'participacoes';
        let titlePrefix = 'Ranking de Participação';
        switch (rankingType) {
            // ... (cases)
        }
        const sortedRanking = Array.from(statsMap.values())
            .filter(entry => entry[sortKey] > 0)
            .sort((a, b) => b[sortKey] - a[sortKey]);
        
        setRankingData(sortedRanking);
        setRankingTitle(`${titlePrefix} ${titleDatePart}`);

    } catch (error) {
        console.error("Erro ao buscar dados para o ranking:", error);
        showNotification("Não foi possível carregar o ranking.", "error");
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchRankingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columnConfig = {
        participacoes: { header: 'Total de Serviços', key: 'participacoes' },
        abordagensPessoas: { header: 'Pessoas Abordadas', key: 'abordagensPessoas' },
        abordagensVeiculos: { header: 'Veículos Abordados', key: 'abordagensVeiculos' },
        prisoes: { header: 'Total de Prisões', key: 'prisoes' },
    };

    return (
        <div>
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h4 className="text-xl font-semibold mb-3">Filtrar Ranking</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* NOVO: Seletor para o tipo de Ranking */}
                    <div>
                        <label className="block text-sm font-bold mb-1">Critério do Ranking</label>
                        <select value={rankingType} onChange={e => setRankingType(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="participacoes">Mais Participações</option>
                            <option value="abordagensPessoas">Mais Abordagens de Pessoas</option>
                            <option value="abordagensVeiculos">Mais Abordagens de Veículos</option>
                            <option value="prisoes">Mais Prisões Realizadas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Tipo de Filtro de Data</label>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="geral">Geral (Todos)</option>
                            <option value="mes">Por Mês</option>
                            <option value="periodo">Período Específico</option>
                        </select>
                    </div>

                    {filterType === 'mes' && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Mês e Ano</label>
                            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"/>
                        </div>
                    )}
                    
                    {filterType === 'periodo' && (
                        <>
                            <div>
                                <label className="block text-sm font-bold mb-1">Data de Início</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Data de Fim</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"/>
                            </div>
                        </>
                    )}
                    
                    <button onClick={fetchRankingData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg md:col-start-4 disabled:bg-gray-500">
                        {loading ? 'Buscando...' : 'Aplicar Filtros'}
                    </button>
                </div>
            </div>

            {loading ? ( <LoadingSpinner /> ) : (
                <>
                    <h3 className="text-2xl font-bold mb-4">{rankingTitle}</h3>
                    <div className="overflow-x-auto bg-gray-800 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-2 py-2 text-center">Rank</th>
                                    <th className="px-4 py-2">Nome</th>
                                    <th className="px-4 py-2">Matrícula</th>
                                    {/* ALTERADO: Cabeçalho da coluna de valor é dinâmico */}
                                    <th className="px-4 py-2 text-center">{columnConfig[rankingType].header}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.length > 0 ? (
                                    rankingData.map((officer, index) => (
                                        <tr key={officer.matricula} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-2 py-2 text-center font-bold text-lg">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                            </td>
                                            <td className="px-4 py-2">{officer.name}</td>
                                            <td className="px-4 py-2 font-mono whitespace-nowrap">{displayMatricula(officer.matricula)}</td>
                                            {/* ALTERADO: Célula de valor é dinâmica */}
                                            <td className="px-4 py-2 text-center font-bold text-lg text-blue-400">{officer[columnConfig[rankingType].key]}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center p-6 text-gray-400">
                                            Nenhum dado encontrado para os filtros selecionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};