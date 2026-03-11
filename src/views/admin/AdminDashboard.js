import React, { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { GenerateVagasForm } from './components/GenerateVagasForm';
import { ReportsDashboardView } from './components/ReportsDashboardView';
import { RankingView } from './components/RankingView';
import { ScheduleManagementView } from './components/ScheduleManagementView';
import { ConvoyManagementView } from './components/ConvoyManagementView';
import { PaymentReportView } from './components/PaymentReportView';
import { OperationCostView } from './components/OperationCostView';
import { OperationReportsView } from './components/OperationReportsView';
import { AlertsView } from './components/AlertsView';
import { UserManagementView } from './components/UserManagementView';
import { HolidayManagementView } from './components/HolidayManagementView';

export default function AdminDashboard({ userData, showNotification }) {
    const [view, setView] = useState('dashboard');
    const [currentWeek, setCurrentWeek] = useState(getWeekInfo());
    const [vagas, setVagas] = useState([]);
    const [teams, setTeams] = useState([]);
    const [convoys, setConvoys] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVagasModalOpen, setIsVagasModalOpen] = useState(false);
    const [holidays, setHolidays] = useState([]);

    const viewNames = {
        dashboard: 'Dashboard',
        cadastro: 'Cadastro Rapido',
        ranking: 'Ranking',
        schedule: 'Escalas',
        convoys: 'Criacao da Operacao',
        paymentReport: 'Relatorio de Pagamento',
        operationCost: 'Custo da Operacao',
        operationReports: 'Relatorios de Operacao',
        alerts: 'Alertas',
        holidays: 'Feriados'
    };

    // Carrega dados iniciais (usuarios e feriados)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [usersRes, holidaysRes] = await Promise.all([
                    apiClient.getPoliciais(),
                    apiClient.getHolidays()
                ]);

                const users = Array.isArray(usersRes) ? usersRes : usersRes?.results || [];
                const hols = Array.isArray(holidaysRes) ? holidaysRes : holidaysRes?.results || [];

                setAllUsers(users);
                setHolidays(hols);
            } catch (error) {
                console.error('Erro ao carregar dados iniciais:', error);
                showNotification('Erro ao carregar dados', 'error');
            }
        };

        loadInitialData();
    }, [showNotification]);

    // Carrega vagas, equipes e comboios para a semana atual
    useEffect(() => {
        const loadWeekData = async () => {
            setLoading(true);
            try {
                const [vagasRes, teamsRes, convoysRes] = await Promise.all([
                    apiClient.getVagas({ week_id: currentWeek.weekId }),
                    apiClient.getTeams({ week_id: currentWeek.weekId }),
                    apiClient.getConvoys({ week_id: currentWeek.weekId })
                ]);

                const vagasData = Array.isArray(vagasRes) ? vagasRes : vagasRes?.results || [];
                const teamsData = Array.isArray(teamsRes) ? teamsRes : teamsRes?.results || [];
                const convoysData = Array.isArray(convoysRes) ? convoysRes : convoysRes?.results || [];

                setVagas(vagasData);
                setTeams(teamsData);
                setConvoys(convoysData);
            } catch (error) {
                console.error('Erro ao carregar dados da semana:', error);
                showNotification('Erro ao carregar dados da semana', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadWeekData();
    }, [currentWeek, showNotification]);

    const generateWeeklyVagas = async (vagasConfig, delegaciaId) => {
        setIsVagasModalOpen(false);
        showNotification('Gerando vagas, por favor aguarde...', 'info');
        try {
            const weekId = currentWeek.weekId;
            const vagasToCreate = [];

            currentWeek.weekDays.forEach((day, index) => {
                const { day: dayVagas, night: nightVagas } = vagasConfig[index];
                const cycleId = getCycleInfo(day).cycleId;
                const dateStr = day.toISOString().split('T')[0];

                for (let i = 0; i < dayVagas; i++) {
                    vagasToCreate.push({
                        data: dateStr,
                        week_id: weekId,
                        cycle_id: cycleId,
                        turno: 'day',
                        status: 'Disponivel',
                        delegacia: delegaciaId
                    });
                }
                for (let i = 0; i < nightVagas; i++) {
                    vagasToCreate.push({
                        data: dateStr,
                        week_id: weekId,
                        cycle_id: cycleId,
                        turno: 'night',
                        status: 'Disponivel',
                        delegacia: delegaciaId
                    });
                }
            });

            // Criar vagas via API Django
            for (const vaga of vagasToCreate) {
                await apiClient.createVaga(vaga);
            }

            showNotification('Vagas da semana geradas com sucesso!', 'success');

            // Recarregar vagas
            const vagasRes = await apiClient.getVagas({ week_id: weekId });
            const vagasData = Array.isArray(vagasRes) ? vagasRes : vagasRes?.results || [];
            setVagas(vagasData);
        } catch (error) {
            console.error('Erro ao gerar vagas:', error);
            showNotification('Falha ao gerar vagas.', 'error');
        }
    };

    const goToPreviousWeek = () => {
        const prevWeekDate = new Date(currentWeek.weekDays[0]);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        setCurrentWeek(getWeekInfo(prevWeekDate));
    };

    const goToNextWeek = () => {
        const nextWeekDate = new Date(currentWeek.weekDays[0]);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        setCurrentWeek(getWeekInfo(nextWeekDate));
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl">
            {isVagasModalOpen && (
                <Modal size="3xl" onClose={() => setIsVagasModalOpen(false)}>
                    <GenerateVagasForm
                        currentWeek={currentWeek}
                        holidays={holidays}
                        onSubmit={generateWeeklyVagas}
                        onCancel={() => setIsVagasModalOpen(false)}
                        defaultDelegaciaId={userData?.delegacia_id}
                    />
                </Modal>
            )}

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h2 className="text-3xl font-bold text-blue-400 mb-4 sm:mb-0">Painel do Administrador</h2>
                    {vagas.length === 0 && !loading && (
                        <button onClick={() => setIsVagasModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                            <PlusCircle size={18} /><span>Gerar Vagas da Semana</span>
                        </button>
                    )}
                </div>

                <div className="flex justify-center items-center space-x-4 mb-6 bg-gray-800 p-2 rounded-lg">
                    <button onClick={goToPreviousWeek} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Semana Anterior">
                        <ChevronDown className="-rotate-90" />
                    </button>
                    <div className="text-center">
                        <span className="font-semibold text-lg text-white">
                            {`Semana de ${currentWeek.weekDays[0].toLocaleDateString('pt-BR')} a ${currentWeek.weekDays[6].toLocaleDateString('pt-BR')}`}
                        </span>
                        <span className="text-xs block text-gray-400"> (Semana {currentWeek.weekId.split('-W')[1]})</span>
                    </div>
                    <button onClick={goToNextWeek} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Proxima Semana">
                        <ChevronUp className="rotate-90" />
                    </button>
                </div>

                <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                    {Object.keys(viewNames).map(v => <button key={v} onClick={() => setView(v)} className={`py-2 px-4 whitespace-nowrap capitalize ${view === v ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>{viewNames[v]}</button>)}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <>
                    {view === 'dashboard' && <ReportsDashboardView showNotification={showNotification} />}
                    {view === 'ranking' && <RankingView showNotification={showNotification} />}
                    {view === 'schedule' && <ScheduleManagementView vagas={vagas} teams={teams} allUsers={allUsers} showNotification={showNotification} weekId={currentWeek.weekId} />}
                    {view === 'convoys' && <ConvoyManagementView teams={teams} convoys={convoys} weekId={currentWeek.weekId} showNotification={showNotification} />}
                    {view === 'paymentReport' && <PaymentReportView allUsers={allUsers} showNotification={showNotification} />}
                    {view === 'operationCost' && <OperationCostView allUsers={allUsers} holidays={holidays} showNotification={showNotification} />}
                    {view === 'operationReports' && <OperationReportsView showNotification={showNotification} />}
                    {view === 'alerts' && <AlertsView showNotification={showNotification} setView={setView} setCurrentWeek={setCurrentWeek} />}
                    {view === 'users' && <UserManagementView userData={userData} showNotification={showNotification} />}
                    {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
                </>
            )}
        </div>
    );
}
