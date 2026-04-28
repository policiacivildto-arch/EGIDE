import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../config/api';
import { getWeekInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { GenerateVagasForm } from '../admin/components/GenerateVagasForm';
import { ReportsDashboardView } from '../admin/components/ReportsDashboardView';
import { RankingView } from '../admin/components/RankingView';
import { ScheduleManagementView } from '../admin/components/ScheduleManagementView';
import { ConvoyManagementView } from '../admin/components/ConvoyManagementView';
import { PaymentReportView } from '../admin/components/PaymentReportView';
import { OperationCostView } from '../admin/components/OperationCostView';
import { OperationReportsView } from '../admin/components/OperationReportsView';
import { AlertsView } from '../admin/components/AlertsView';
import { HolidayManagementView } from '../admin/components/HolidayManagementView';
import { useSearchParams } from 'react-router-dom';

/**
 * Dashboard de Departamento - Sistema EGIDE
 * Mesmas funcionalidades do Admin, mas filtradas por departamento
 */
export default function DashboardDepartamento({ userData, showNotification }) {
    const [view, setView] = useState('dashboard');
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentWeek, setCurrentWeek] = useState(getWeekInfo());
    const [vagas, setVagas] = useState([]);
    const [teams, setTeams] = useState([]);
    const [convoys, setConvoys] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVagasModalOpen, setIsVagasModalOpen] = useState(false);
    const [holidays, setHolidays] = useState([]);

    // Departamento do usuário logado
    const userDepartamento = userData?.departamento || '';

    const toIsoLocalDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const viewNames = useMemo(() => ({ 
        dashboard: 'Dashboard', 
        ranking: 'Ranking',
        schedule: 'Escalas', 
        convoys: 'Criação da Operação', 
        paymentReport: 'Frequência',
        operationCost: 'Relatório de Pagamento',
        operationReports: 'Relatórios de Operação', 
        alerts: 'Alertas', 
        holidays: 'Feriados' 
    }), []);

    const setViewAndSyncUrl = (nextView) => {
        if (nextView === view) return;
        setView(nextView);
        const nextParams = new URLSearchParams(searchParams);
        if (nextView === 'dashboard') {
            nextParams.delete('view');
        } else {
            nextParams.set('view', nextView);
        }
        setSearchParams(nextParams, { replace: true });
    };

    useEffect(() => {
        const viewFromUrl = searchParams.get('view');
        const targetView = viewFromUrl && viewNames[viewFromUrl] ? viewFromUrl : 'dashboard';

        if (targetView !== view) {
            setView(targetView);
        }
    }, [searchParams, view, viewNames]);

    // Carregar usuários e feriados
    useEffect(() => {
        let isMounted = true;

        const loadHeaderData = async () => {
            try {
                const [usersResponse, holidaysResponse] = await Promise.all([
                    apiClient.getPoliciais(),
                    apiClient.getHolidays(),
                ]);

                if (!isMounted) return;

                const users = Array.isArray(usersResponse)
                    ? usersResponse
                    : (usersResponse?.results || []);
                const holidaysList = Array.isArray(holidaysResponse)
                    ? holidaysResponse
                    : (holidaysResponse?.results || []);

                setAllUsers(
                    userDepartamento
                        ? users.filter((u) => (u.departamento || u.departamento_nome) === userDepartamento)
                        : users
                );
                setHolidays(
                    holidaysList
                        .map((item) => item?.data || item?.date)
                        .filter(Boolean)
                        .map((dateValue) => new Date(dateValue).toDateString())
                );
            } catch (error) {
                console.warn('Falha ao carregar usuários/feriados do departamento:', error);
            }
        };

        loadHeaderData();
        const interval = setInterval(loadHeaderData, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [userDepartamento]);

    // Carregar dados da semana filtrados por departamento
    useEffect(() => {
        let isMounted = true;

        const loadWeekData = async () => {
            setLoading(true);
            try {
                const weekStart = toIsoLocalDate(currentWeek.weekDays[0]);
                const weekEnd = toIsoLocalDate(currentWeek.weekDays[6]);

                const [vagasResponse, teamsResponse, convoysResponse] = await Promise.all([
                    apiClient.getVagas({
                        data__gte: weekStart,
                        data__lte: weekEnd,
                    }),
                    apiClient.getTeams({
                        'vaga__data__gte': weekStart,
                        'vaga__data__lte': weekEnd,
                    }),
                    apiClient.getConvoys(),
                ]);

                if (!isMounted) return;

                const vagasList = Array.isArray(vagasResponse)
                    ? vagasResponse
                    : (vagasResponse?.results || []);
                const teamsList = Array.isArray(teamsResponse)
                    ? teamsResponse
                    : (teamsResponse?.results || []);
                const convoysAll = Array.isArray(convoysResponse)
                    ? convoysResponse
                    : (convoysResponse?.results || []);

                const convoysList = convoysAll.filter((item) => {
                    const convoyDate = item?.data || item?.date;
                    if (!convoyDate) return false;
                    const isoDate = typeof convoyDate === 'string'
                        ? convoyDate.split('T')[0]
                        : toIsoLocalDate(new Date(convoyDate.seconds * 1000));
                    return isoDate >= weekStart && isoDate <= weekEnd;
                });

                setVagas(vagasList.map((vaga) => ({
                    ...vaga,
                    date: vaga?.data || vaga?.date,
                    shiftType: vaga?.turno || vaga?.shiftType,
                })));
                setTeams(teamsList);
                setConvoys(convoysList);
            } catch (error) {
                console.error('Erro ao carregar dados do departamento:', error);
                if (isMounted) {
                    setVagas([]);
                    setTeams([]);
                    setConvoys([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadWeekData();
        return () => {
            isMounted = false;
        };
    }, [currentWeek, userDepartamento]);

    const generateWeeklyVagas = async (vagasConfig) => {
        setIsVagasModalOpen(false);
        showNotification("Gerando vagas, por favor aguarde...", "info");
        try {
            const weekId = currentWeek.weekId;
            const delegaciasResponse = await apiClient.getDelegacias();
            const delegacias = Array.isArray(delegaciasResponse)
                ? delegaciasResponse
                : (delegaciasResponse?.results || []);
            if (delegacias.length === 0) {
                throw new Error('Nenhuma delegacia encontrada para criar vagas.');
            }

            // Prioriza a delegacia vinculada ao usuário logado.
            let delegaciaId = Number(userData?.delegacia_id) || null;

            // Para perfil de departamento sem delegacia fixa, tenta escolher uma delegacia do mesmo departamento.
            if (!delegaciaId) {
                const departamentoKey = String(userDepartamento || '').trim().toUpperCase();
                const delegaciasDoDepartamento = departamentoKey
                    ? delegacias.filter((item) => String(item?.departamento_nome || '').trim().toUpperCase().includes(departamentoKey))
                    : [];

                delegaciaId = delegaciasDoDepartamento[0]?.id || delegacias[0]?.id || null;
            }

            if (!delegaciaId) {
                throw new Error('Não foi possível determinar a delegacia para criar vagas.');
            }
            const weekStart = toIsoLocalDate(currentWeek.weekDays[0]);
            const weekEnd = toIsoLocalDate(currentWeek.weekDays[6]);

            const existentesResponse = await apiClient.getVagas({
                delegacia: delegaciaId,
                data__gte: weekStart,
                data__lte: weekEnd,
            });
            const existentes = Array.isArray(existentesResponse)
                ? existentesResponse
                : (existentesResponse?.results || []);
            const existentesMap = new Map(
                existentes.map((vaga) => [`${vaga.data}_${vaga.turno}_${vaga.delegacia}`, vaga])
            );

            const upserts = [];
            currentWeek.weekDays.forEach((day, index) => {
                const { day: dayVagas, night: nightVagas } = vagasConfig[index];
                const dataStr = toIsoLocalDate(day);
                const departmentSuffix = userDepartamento ? ` (${userDepartamento})` : '';
                const descricaoDiurna = `Vaga Diurna - Semana ${weekId}${departmentSuffix}`;
                const descricaoNoturna = `Vaga Noturna - Semana ${weekId}${departmentSuffix}`;

                upserts.push(
                    {
                        data: dataStr,
                        turno: 'day',
                        delegacia: delegaciaId,
                        posicoes_disponiveis: dayVagas,
                        status: 'Disponível',
                        descricao: descricaoDiurna,
                    },
                    {
                        data: dataStr,
                        turno: 'night',
                        delegacia: delegaciaId,
                        posicoes_disponiveis: nightVagas,
                        status: 'Disponível',
                        descricao: descricaoNoturna,
                    }
                );
            });

            await Promise.all(
                upserts
                    .filter((vagaPayload) => Number(vagaPayload.posicoes_disponiveis) > 0)
                    .map(async (vagaPayload) => {
                        const key = `${vagaPayload.data}_${vagaPayload.turno}_${vagaPayload.delegacia}`;
                        const existente = existentesMap.get(key);
                        if (existente) {
                            return apiClient.updateVaga(existente.id, {
                                posicoes_disponiveis: vagaPayload.posicoes_disponiveis,
                                status: vagaPayload.status,
                                descricao: vagaPayload.descricao,
                            });
                        }
                        return apiClient.createVaga(vagaPayload);
                    })
            );

            showNotification("Vagas da semana geradas com sucesso!", "success");

            // Recarrega vagas da semana após geração para refletir os novos registros imediatamente.
            const vagasAtualizadasResponse = await apiClient.getVagas({
                delegacia: delegaciaId,
                data__gte: weekStart,
                data__lte: weekEnd,
            });
            const vagasAtualizadas = Array.isArray(vagasAtualizadasResponse)
                ? vagasAtualizadasResponse
                : (vagasAtualizadasResponse?.results || []);

            setVagas(vagasAtualizadas.map((vaga) => ({
                ...vaga,
                date: vaga?.data || vaga?.date,
                shiftType: vaga?.turno || vaga?.shiftType,
            })));
        } catch (error) {
            console.error("Erro ao gerar vagas:", error);
            const backendMessage = String(error?.message || '').trim();
            showNotification(
                backendMessage ? `Falha ao gerar vagas: ${backendMessage}` : "Falha ao gerar vagas.",
                "error"
            );
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
                    <div>
                        <h2 className="text-3xl font-bold text-blue-400 mb-1">Painel do Departamento</h2>
                        <p className="text-sm text-gray-400">{userDepartamento}</p>
                    </div>
                    {vagas.length === 0 && !loading && (
                        <button onClick={() => setIsVagasModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                            <PlusCircle size={18} /><span>Gerar Vagas da Semana</span>
                        </button>
                    )}
                </div>
                
                {/* Controles de Navegação da Semana */}
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
                    <button onClick={goToNextWeek} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Próxima Semana">
                        <ChevronRight />
                    </button>
                </div>

                <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                    {Object.keys(viewNames).map(v => 
                        <button 
                            key={v} 
                            onClick={() => setViewAndSyncUrl(v)} 
                            className={`py-2 px-4 whitespace-nowrap capitalize ${view === v ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}
                        >
                            {viewNames[v]}
                        </button>
                    )}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <>
                    {view === 'dashboard' && <ReportsDashboardView showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'ranking' && <RankingView showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'schedule' && <ScheduleManagementView vagas={vagas} teams={teams} allUsers={allUsers} showNotification={showNotification} weekId={currentWeek.weekId} departamento={userDepartamento} />}
                    {view === 'convoys' && <ConvoyManagementView teams={teams} convoys={convoys} weekId={currentWeek.weekId} showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'paymentReport' && <PaymentReportView allUsers={allUsers} showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'operationCost' && <OperationCostView allUsers={allUsers} holidays={holidays} showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'operationReports' && <OperationReportsView showNotification={showNotification} departamento={userDepartamento} />}
                    {view === 'alerts' && <AlertsView showNotification={showNotification} setView={setViewAndSyncUrl} setCurrentWeek={setCurrentWeek} departamento={userDepartamento} />}
                    {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
                </>
            )}
        </div>
    );
}

DashboardDepartamento.propTypes = {
    userData: PropTypes.shape({
        departamento: PropTypes.string,
        delegacia_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    showNotification: PropTypes.func,
};
