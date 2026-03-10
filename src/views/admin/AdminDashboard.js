import React, { useMemo, useState } from 'react';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../config/api';
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { useAdminData } from './useAdminData';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
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
  const [isVagasModalOpen, setIsVagasModalOpen] = useState(false);
  const { vagas, teams, convoys, allUsers, holidays, loading, refresh } = useAdminData();

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
    holidays: 'Feriados',
  };

  const holidayDateStrings = useMemo(() => {
    return holidays
      .map((holiday) => {
        const rawDate = holiday?.data || holiday?.date;
        const parsedDate = rawDate ? new Date(rawDate) : null;
        return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toDateString() : null;
      })
      .filter(Boolean);
  }, [holidays]);

  const isSameWeekOrUnspecified = (item) => {
    const weekKey = item?.weekId || item?.week_id || item?.vaga_info?.weekId || item?.vaga_info?.week_id;
    return !weekKey || weekKey === currentWeek.weekId;
  };

  const weekVagas = useMemo(() => vagas.filter(isSameWeekOrUnspecified), [vagas, currentWeek.weekId]);
  const weekTeams = useMemo(() => teams.filter(isSameWeekOrUnspecified), [teams, currentWeek.weekId]);
  const weekConvoys = useMemo(() => convoys.filter(isSameWeekOrUnspecified), [convoys, currentWeek.weekId]);

  const generateWeeklyVagas = async (vagasConfig) => {
    setIsVagasModalOpen(false);
    showNotification('Gerando vagas, por favor aguarde...', 'info');

    try {
      const weekId = currentWeek.weekId;
      const payloads = [];

      currentWeek.weekDays.forEach((day, index) => {
        const { day: dayVagas, night: nightVagas } = vagasConfig[index];
        const cycleId = getCycleInfo(day).cycleId;
        const isoDate = day.toISOString().split('T')[0];

        for (let i = 0; i < dayVagas; i++) {
          payloads.push({
            data: isoDate,
            weekId,
            cycleId,
            turno: 'day',
            status: 'Disponivel',
            posicoes_disponiveis: 1,
          });
        }

        for (let i = 0; i < nightVagas; i++) {
          payloads.push({
            data: isoDate,
            weekId,
            cycleId,
            turno: 'night',
            status: 'Disponivel',
            posicoes_disponiveis: 1,
          });
        }
      });

      await Promise.all(payloads.map((payload) => apiClient.createVaga(payload)));
      await refresh();
      showNotification('Vagas da semana geradas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao gerar vagas:', error);
      showNotification('Falha ao gerar vagas. Verifique o cadastro de delegacia padrao no backend.', 'error');
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
            holidays={holidayDateStrings}
            onSubmit={generateWeeklyVagas}
            onCancel={() => setIsVagasModalOpen(false)}
          />
        </Modal>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
          <h2 className="text-3xl font-bold text-blue-400 mb-4 sm:mb-0">Painel do Administrador</h2>
          {weekVagas.length === 0 && !loading && (
            <button
              onClick={() => setIsVagasModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              <PlusCircle size={18} />
              <span>Gerar Vagas da Semana</span>
            </button>
          )}
        </div>

        <div className="flex justify-center items-center space-x-4 mb-6 bg-gray-800 p-2 rounded-lg">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title="Semana Anterior"
          >
            <ChevronDown className="-rotate-90" />
          </button>
          <div className="text-center">
            <span className="font-semibold text-lg text-white">
              {`Semana de ${currentWeek.weekDays[0].toLocaleDateString('pt-BR')} a ${currentWeek.weekDays[6].toLocaleDateString('pt-BR')}`}
            </span>
            <span className="text-xs block text-gray-400"> (Semana {currentWeek.weekId.split('-W')[1]})</span>
          </div>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title="Proxima Semana"
          >
            <ChevronUp className="rotate-90" />
          </button>
        </div>

        <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
          {Object.keys(viewNames).map((key) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`py-2 px-4 whitespace-nowrap capitalize ${
                view === key ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'
              }`}
            >
              {viewNames[key]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {view === 'dashboard' && <ReportsDashboardView showNotification={showNotification} />}
          {view === 'cadastro' && <UserManagementView userData={userData} showNotification={showNotification} />}
          {view === 'ranking' && <RankingView showNotification={showNotification} />}
          {view === 'schedule' && (
            <ScheduleManagementView
              vagas={weekVagas}
              teams={weekTeams}
              allUsers={allUsers}
              showNotification={showNotification}
              weekId={currentWeek.weekId}
            />
          )}
          {view === 'convoys' && (
            <ConvoyManagementView
              teams={weekTeams}
              convoys={weekConvoys}
              weekId={currentWeek.weekId}
              showNotification={showNotification}
            />
          )}
          {view === 'paymentReport' && <PaymentReportView allUsers={allUsers} showNotification={showNotification} />}
          {view === 'operationCost' && (
            <OperationCostView allUsers={allUsers} holidays={holidayDateStrings} showNotification={showNotification} />
          )}
          {view === 'operationReports' && <OperationReportsView showNotification={showNotification} />}
          {view === 'alerts' && (
            <AlertsView showNotification={showNotification} setView={setView} setCurrentWeek={setCurrentWeek} />
          )}
          {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
        </>
      )}
    </div>
  );
}
