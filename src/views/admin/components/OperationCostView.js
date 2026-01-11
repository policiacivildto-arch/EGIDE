// src/views/admin/components/OperationCost.js
import React, { useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase'; // Import correto!    
import { useAdminData } from '../useAdminData';
import { calculateShiftCost, displayMatricula } from '../../../utils/helpers';
import { LoadingSpinner } from '../../../components/ui/Shared';

export const OperationCostView = ({ showNotification, allUsers, holidays, departamento }) => {
    const adminData = useAdminData();
    allUsers = allUsers || adminData.allUsers;
    holidays = holidays || adminData.holidays;
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [costData, setCostData] = useState(null); // Armazena os resultados do cálculo

    // Para otimizar, criamos um mapa de Matrícula -> Detalhes do Usuário
    const userMatriculaMap = useMemo(() => 
        new Map(allUsers.map(u => [u.matricula, u])), 
    [allUsers]);

    const handleCalculateCost = async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setCostData(null);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // 1. Busca todos os comboios (operações) no período selecionado
            let convoysQuery = query(
                collection(db, `/artifacts/${appId}/public/data/convoys`),
                where("date", ">=", start),
                where("date", "<=", end)
            );
            
            // Se houver departamento, adicionar filtro
            if (departamento) {
                convoysQuery = query(
                    collection(db, `/artifacts/${appId}/public/data/convoys`),
                    where("date", ">=", start),
                    where("date", "<=", end),
                    where("departamento", "==", departamento)
                );
            }
            
            const convoysSnap = await getDocs(convoysQuery);
            const convoys = convoysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (convoys.length === 0) {
                showNotification("Nenhuma operação encontrada para o período.", "info");
                setLoading(false);
                return;
            }

            // 2. Otimização: Pega todos os IDs de equipe de todas as operações de uma vez
            const allTeamIds = [...new Set(convoys.flatMap(c => c.teamIds))];
            if (allTeamIds.length === 0) {
                 showNotification("Operações encontradas não possuem equipes associadas.", "warning");
                 setLoading(false);
                 return;
            }
            // ... e busca todas as equipes necessárias em uma única consulta
            const teamsQuery = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("id", "in", allTeamIds));
            const teamsSnap = await getDocs(teamsQuery);
            const teamMap = new Map(teamsSnap.docs.map(doc => [doc.id, doc.data()]));
            
            // 3. Calcula o custo para cada operação
            let grandTotalCost = 0;
            const operationsDetails = convoys.map(convoy => {
                let currentOperationCost = 0;
                
                convoy.teamIds.forEach(teamId => {
    const team = teamMap.get(teamId);
    if (team) {
        const date = new Date(team.vagaDate.seconds * 1000);
        // HORÁRIOS FIXOS BASEADOS NO TURNO
        const startTime = team.horarioEntrada || (team.vagaShiftType === 'day' ? '08:00' : '19:00');
        const endTime = team.horarioSaida || (team.vagaShiftType === 'day' ? '20:00' : '01:00');
        
                      team.members.forEach(member => {
            const userDetails = userMatriculaMap.get(member.matricula);
            if (userDetails && userDetails.cargo && userDetails.classe) {
                currentOperationCost += calculateShiftCost(userDetails, date, startTime, endTime, holidays);
            } else {
                console.warn(`Custo não calculado para ${member.nome} (Mat. ${member.matricula}) por falta de 'cargo' ou 'classe' no cadastro.`);
            }
        });
    }
});
                grandTotalCost += currentOperationCost;
                return {
                    id: convoy.id,
                    date: new Date(convoy.date.seconds * 1000),
                    ais: convoy.ais,
                    bairros: Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairro,
                    cost: currentOperationCost
                };
            });
            
            setCostData({
                totalCost: grandTotalCost,
                operations: operationsDetails.sort((a,b) => a.date - b.date),
                totalOperations: convoys.length
            });

        } catch (error) {
            console.error("Erro ao calcular custo:", error);
            showNotification("Falha ao calcular o custo das operações.", "error");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Relatório de Custo das Operações</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label className="block text-sm font-bold mb-1">Data de Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label className="block text-sm font-bold mb-1">Data de Fim</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={handleCalculateCost} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Calculando...' : 'Calcular Custo'}
                </button>
            </div>
            
            {loading && <LoadingSpinner />}
            
            {costData && (
                 <div className="animate-fade-in space-y-6">
                    {/* --- SEÇÃO DE RESUMO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-green-400">R$ {costData.totalCost.toFixed(2).replace('.', ',')}</p>
                            <p className="text-sm text-gray-400">Custo Total no Período</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-blue-400">{costData.totalOperations}</p>
                            <p className="text-sm text-gray-400">Operações Realizadas</p>
                        </div>
                    </div>
                    
                    {/* --- TABELA DETALHADA --- */}
                    <div className="overflow-x-auto bg-gray-800 rounded-lg">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-4 py-2">Data</th>
                                    <th className="px-4 py-2">Área (AIS)</th>
                                    <th className="px-4 py-2">Bairro(s)</th>
                                    <th className="px-4 py-2 text-right">Custo Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costData.operations.map(op => (
                                    <tr key={op.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-4 py-2">{op.date.toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-2">{op.ais}</td>
                                        <td className="px-4 py-2">{op.bairros}</td>
                                        <td className="px-4 py-2 text-right font-bold text-green-400">R$ {op.cost.toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
