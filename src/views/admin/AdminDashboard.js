import React, { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

    const adminDepartamento =
        userData?.departamento ||
        userData?.departamento_nome ||
        userData?.perfil_departamento?.sigla ||
        userData?.perfil_departamento?.departamento?.sigla ||
        userData?.perfil_departamento?.departamento_nome ||
        '';

    const toIsoLocalDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const viewNames = {
        dashboard: 'Dashboard',
        ranking: 'Ranking',
        schedule: 'Escalas',
        convoys: 'Criacao da Operacao',
        paymentReport: 'Frequência',
        operationCost: 'Relatório de Pagamento',
        operationReports: 'Relatorios de Operacao',
        alerts: 'Alertas',
        holidays: 'Feriados'
    };

    // Carrega dados iniciais (usuarios e feriados)
    useEffect(() => {
        const fetchAllPoliciais = async () => {
            const all = [];
            let page = 1;

            while (true) {
                const res = await apiClient.getPoliciais({ page, page_size: 200 });
                const pageItems = Array.isArray(res) ? res : res?.results || [];
                all.push(...pageItems);

                if (Array.isArray(res) || !res?.next) break;
                page += 1;
            }

            return all;
        };

        const loadInitialData = async () => {
            try {
                const [usersRes, holidaysRes] = await Promise.all([
                    fetchAllPoliciais(),
                    apiClient.getHolidays()
                ]);

                const users = (Array.isArray(usersRes) ? usersRes : usersRes?.results || []).map((u) => ({
                    ...u,
                    nome: u?.nome || u?.usuario?.first_name || u?.usuario?.username || 'Sem nome',
                }));
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
                const weekStart = toIsoLocalDate(currentWeek.weekDays[0]);
                const weekEnd = toIsoLocalDate(currentWeek.weekDays[6]);

                const [vagasRes, teamsRes, convoysRes] = await Promise.all([
                    apiClient.getVagas({ data__gte: weekStart, data__lte: weekEnd }),
                    apiClient.getTeams({ 'vaga__data__gte': weekStart, 'vaga__data__lte': weekEnd }),
                    apiClient.getConvoys()
                ]);

                const vagasData = Array.isArray(vagasRes) ? vagasRes : vagasRes?.results || [];
                const teamsRaw = Array.isArray(teamsRes) ? teamsRes : teamsRes?.results || [];
                const convoysAll = Array.isArray(convoysRes) ? convoysRes : convoysRes?.results || [];

                const vagasFiltered = vagasData.filter((vaga) => {
                    const vagaDate = vaga?.data || vaga?.date;
                    if (!vagaDate) return false;
                    const isoDate = String(vagaDate).split('T')[0];
                    return isoDate >= weekStart && isoDate <= weekEnd;
                });

                const vagaIds = new Set(vagasFiltered.map((vaga) => Number(vaga?.id)).filter(Number.isFinite));

                const teamsData = teamsRaw.filter((team) => {
                    const teamVagaId = Number(team?.vaga || team?.vagaId || team?.vaga_info?.id);
                    if (Number.isFinite(teamVagaId) && vagaIds.has(teamVagaId)) return true;

                    const teamDate = team?.vaga_info?.data || team?.vagaDate;
                    if (!teamDate) return false;
                    const isoDate = String(teamDate).split('T')[0];
                    return isoDate >= weekStart && isoDate <= weekEnd;
                });

                const convoysData = convoysAll.filter((item) => {
                    const convoyDate = item?.data || item?.date;
                    if (!convoyDate) return false;
                    const isoDate = typeof convoyDate === 'string'
                        ? convoyDate.split('T')[0]
                        : toIsoLocalDate(new Date(convoyDate.seconds * 1000));
                    return isoDate >= weekStart && isoDate <= weekEnd;
                });

                setVagas(vagasFiltered);
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

    const generateWeeklyVagas = async (vagasConfig) => {
        setIsVagasModalOpen(false);
        showNotification('Gerando vagas, por favor aguarde...', 'info');
        try {
            const weekId = currentWeek.weekId;
            const vagasToCreate = [];

            // O backend exige delegacia (FK) e unicidade por data+turno+delegacia.
            let delegaciaId = Number(userData?.delegacia_id) || null;
            if (!delegaciaId) {
                const delegaciasRes = await apiClient.getDelegacias();
                const delegacias = Array.isArray(delegaciasRes) ? delegaciasRes : delegaciasRes?.results || [];
                const dto = delegacias.find((d) => d?.nome?.toUpperCase().includes('DTO'));
                delegaciaId = dto?.id || delegacias[0]?.id || null;
            }

            if (!delegaciaId) {
                throw new Error('Nenhuma delegacia encontrada para gerar vagas.');
            }

            currentWeek.weekDays.forEach((day, index) => {
                const { day: dayVagas, night: nightVagas } = vagasConfig[index];
                const cycleId = getCycleInfo(day).cycleId;
                const dateStr = toIsoLocalDate(day);

                if (Number(dayVagas) > 0) {
                    vagasToCreate.push({
                        data: dateStr,
                        week_id: weekId,
                        cycle_id: cycleId,
                        delegacia: delegaciaId,
                        turno: 'day',
                        posicoes_disponiveis: Number(dayVagas),
                        status: 'Disponivel'
                    });
                }
                if (Number(nightVagas) > 0) {
                    vagasToCreate.push({
                        data: dateStr,
                        week_id: weekId,
                        cycle_id: cycleId,
                        delegacia: delegaciaId,
                        turno: 'night',
                        posicoes_disponiveis: Number(nightVagas),
                        status: 'Disponivel'
                    });
                }
            });

            // Criar vagas via API Django
            for (const vaga of vagasToCreate) {
                await apiClient.createVaga(vaga);
            }

            showNotification('Vagas da semana geradas com sucesso!', 'success');

            // Recarregar vagas
            const weekStart = toIsoLocalDate(currentWeek.weekDays[0]);
            const weekEnd = toIsoLocalDate(currentWeek.weekDays[6]);
            const vagasRes = await apiClient.getVagas({ data__gte: weekStart, data__lte: weekEnd });
            const vagasData = Array.isArray(vagasRes) ? vagasRes : vagasRes?.results || [];
            const vagasFiltered = vagasData.filter((vaga) => {
                const vagaDate = vaga?.data || vaga?.date;
                if (!vagaDate) return false;
                const isoDate = String(vagaDate).split('T')[0];
                return isoDate >= weekStart && isoDate <= weekEnd;
            });
            setVagas(vagasFiltered);
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
                        <ChevronLeft />
                    </button>
                    <div className="text-center">
                        <span className="font-semibold text-lg text-white">
                            {`Semana de ${currentWeek.weekDays[0].toLocaleDateString('pt-BR')} a ${currentWeek.weekDays[6].toLocaleDateString('pt-BR')}`}
                        </span>
                        <span className="text-xs block text-gray-400"> (Semana {currentWeek.weekId.split('-W')[1]})</span>
                    </div>
                    <button onClick={goToNextWeek} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Proxima Semana">
                        <ChevronRight />
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
                    {view === 'schedule' && <ScheduleManagementView vagas={vagas} teams={teams} allUsers={allUsers} showNotification={showNotification} weekId={currentWeek.weekId} departamento={adminDepartamento} />}
                    {view === 'convoys' && <ConvoyManagementView teams={teams} convoys={convoys} weekId={currentWeek.weekId} showNotification={showNotification} />}
                    {view === 'paymentReport' && <PaymentReportView allUsers={allUsers} showNotification={showNotification} departamento={adminDepartamento} />}
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
