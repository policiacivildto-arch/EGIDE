
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { getCycleInfo, getWeekInfo, displayMatricula } from '../../../utils/helpers';

export const AlertsView = ({ showNotification, setView, setCurrentWeek, departamento }) => {
    const [savedAlerts, setSavedAlerts] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    const [scanCycle, setScanCycle] = useState(getCycleInfo().cycleId);
    const [loadingScan, setLoadingScan] = useState(false);
    const [foundIssues, setFoundIssues] = useState([]);

    useEffect(() => {
        setSavedAlerts([]);
    }, []);

    const parseDateSafely = (rawDate) => {
        if (!rawDate) return null;

        if (rawDate instanceof Date) {
            return Number.isNaN(rawDate.getTime()) ? null : rawDate;
        }

        if (typeof rawDate === 'string') {
            const isoDateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawDate);
            if (isoDateMatch) {
                return new Date(`${isoDateMatch[1]}T12:00:00`);
            }

            const parsed = new Date(rawDate);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        if (rawDate?.seconds) {
            const parsed = new Date(rawDate.seconds * 1000);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        return null;
    };

    const handleGoToSchedule = (date) => {
        if (!date || !setView || !setCurrentWeek) return;
        const parsed = parseDateSafely(date);
        if (!parsed) return;
        setCurrentWeek(getWeekInfo(parsed));
        setView('schedule');
    };

    const handleScanForIssues = async () => {
        setLoadingScan(true);
        setFoundIssues([]);
        showNotification("Iniciando verificação... Isso pode levar alguns segundos.", "info");

        try {
            const [year, month] = scanCycle.split('-').map(Number);
            const cycleStart = new Date(year, month - 1, 1);
            const cycleEnd = new Date(year, month, 0);
            const startIso = cycleStart.toISOString().split('T')[0];
            const endIso = cycleEnd.toISOString().split('T')[0];

            const teamsResponse = await apiClient.getTeams({
                'vaga__data__gte': startIso,
                'vaga__data__lte': endIso,
            });
            const teams = Array.isArray(teamsResponse)
                ? teamsResponse
                : (teamsResponse?.results || []);

            if (teams.length === 0) {
                showNotification("Nenhuma equipe encontrada para o ciclo selecionado.", "warning");
                setLoadingScan(false);
                return;
            }

            const officerSchedules = new Map();
            teams.forEach(team => {
                const leaderName = team?.chefe_nome;
                const leaderMatricula = team?.chefe_matricula || team?.chefe?.matricula || null;
                const vagaDate = team?.vaga_info?.data || team?.vagaDate;
                const parsedDate = parseDateSafely(vagaDate);

                if (!leaderName || !leaderMatricula || !parsedDate || Number.isNaN(parsedDate.getTime())) return;

                if (!officerSchedules.has(leaderMatricula)) {
                    officerSchedules.set(leaderMatricula, {
                        info: { nome: leaderName, matricula: leaderMatricula },
                        shifts: [],
                    });
                }

                officerSchedules.get(leaderMatricula).shifts.push({
                    date: parsedDate,
                    shiftType: team?.vaga_info?.turno || team?.vagaShiftType,
                    team: team?.vaga_info?.delegacia_nome || team?.delegaciaPrincipal || 'Equipe',
                });
            });

            const issues = [];
            for (const [matricula, data] of officerSchedules.entries()) {
                const sortedShifts = data.shifts.sort((a, b) => a.date - b.date);
                const dailyCount = new Map();
                sortedShifts.forEach(shift => {
                    const dayKey = shift.date.toDateString();
                    dailyCount.set(dayKey, (dailyCount.get(dayKey) || 0) + 1);
                });

                for (const [day, count] of dailyCount.entries()) {
                    if (count > 1) {
                        issues.push({
                            type: 'Escala Dupla',
                            officer: data.info,
                            message: `está escalado ${count} vezes no mesmo dia.`,
                            details: `Data: ${new Date(day).toLocaleDateString('pt-BR')}`,
                            dateObject: new Date(day)
                        });
                    }
                }

                for (let i = 0; i < sortedShifts.length - 1; i++) {
                    const currentShift = sortedShifts[i];
                    const nextShift = sortedShifts[i + 1];
                    if (currentShift.shiftType === 'night') {
                        const nextDay = new Date(currentShift.date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        if (nextShift.shiftType === 'day' && nextShift.date.toDateString() === nextDay.toDateString()) {
                            issues.push({
                                type: 'Falta de Descanso',
                                officer: data.info,
                                message: 'possui um turno diurno sem o descanso adequado após um turno noturno.',
                                details: `Noturno em ${currentShift.date.toLocaleDateString('pt-BR')} | Diurno em ${nextShift.date.toLocaleDateString('pt-BR')}`,
                                dateObject: currentShift.date
                            });
                        }
                    }
                }
            }
            setFoundIssues(issues);
            showNotification(`Verificação concluída. ${issues.length} inconsistências encontradas.`, issues.length > 0 ? "warning" : "success");

        } catch (error) {
            console.error("Erro ao verificar escalas:", error);
            showNotification("Ocorreu um erro durante a verificação.", "error");
        } finally {
            setLoadingScan(false);
        }
    };

    const handleReview = async () => showNotification("Recurso de revisão de alertas salvos será habilitado quando existir endpoint Django dedicado.", "info");

    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Painel de Alertas e Auditoria de Escalas</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-8 border border-blue-500">
                <h4 className="text-xl font-bold mb-3 text-blue-400">Verificação de Escala (Anti-Burla)</h4>
                <div className="flex items-end space-x-4 mb-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Selecione o Ciclo (Mês/Ano)</label>
                        <input
                            type="month"
                            value={scanCycle.substring(0, 7)}
                            onChange={e => setScanCycle(getCycleInfo(new Date(e.target.value + '-25')).cycleId)}
                            className="w-full p-2 bg-gray-700 rounded-md"
                        />
                    </div>
                    <button onClick={handleScanForIssues} disabled={loadingScan} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 flex items-center">
                        {loadingScan ? <LoadingSpinner /> : <><AlertTriangle size={18} className="mr-2" /><span>Verificar Agora</span></>}
                    </button>
                </div>

                {foundIssues.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="text-lg font-semibold text-yellow-300 mt-4">Inconsistências Encontradas:</h5>
                        {foundIssues.map((issue, index) => (
                            <div key={index} className="p-3 rounded-lg bg-yellow-900/70 border-l-4 border-yellow-400 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-yellow-300">{issue.type}</p>
                                    <p className="text-sm">
                                        <span className='font-semibold'>{issue.officer.nome}</span> (Mat. {displayMatricula(issue.officer.matricula)}) {issue.message}
                                    </p>
                                    <p className="text-xs text-gray-400">{issue.details}</p>
                                </div>
                                <button
                                    onClick={() => handleGoToSchedule(issue.dateObject)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg ml-4 flex-shrink-0"
                                >
                                    Ver na Escala
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-xl font-bold mb-3 text-gray-300">Alertas do Sistema Salvos</h4>
                {loadingSaved ? <LoadingSpinner /> : (
                    <div className="space-y-4">
                        {savedAlerts.length === 0 && <p className="text-gray-400">Sem endpoint Django para alertas persistidos no momento.</p>}
                        {savedAlerts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(alert => (
                            <div key={alert.id} className={`p-4 rounded-lg ${alert.status === 'new' ? 'bg-yellow-900/50' : 'bg-gray-900'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-yellow-300">{alert.type.replace('_', ' ')}</p>
                                        <p className="text-sm">{alert.message}</p>
                                        <p className="text-xs text-gray-400">Em: {alert.createdAt?.seconds ? new Date(alert.createdAt.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}</p>
                                    </div>
                                    {alert.status === 'new' && (<button onClick={() => handleReview(alert.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-xs">Revisado</button>)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};