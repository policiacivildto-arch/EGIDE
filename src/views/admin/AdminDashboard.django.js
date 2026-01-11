import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';      
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Importações dos componentes filhos
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

// 🆕 NOVO: Hook Django API
import { useAdminDataDjango } from '../../hooks/useAdminDataDjango';
import { vagaService } from '../../services/djangoApi';

/**
 * AdminDashboard - Versão HÍBRIDA Django + Firebase
 * 
 * DADOS DO DJANGO:
 * - vagas, teams, convoys, allUsers (via useAdminDataDjango)
 * 
 * AINDA NO FIREBASE:
 * - holidays (ainda não implementado no Django)
 * - generateWeeklyVagas (criação em lote)
 */
export default function AdminDashboard({ userData, showNotification }) {
    const [view, setView] = useState('dashboard');
    const [currentWeek, setCurrentWeek] = useState(getWeekInfo());
    const [isVagasModalOpen, setIsVagasModalOpen] = useState(false);
    const [holidays, setHolidays] = useState([]);

    const viewNames = { 
        dashboard: 'Dashboard', 
        ranking: 'Ranking',
        schedule: 'Escalas', 
        convoys: 'Criação da Operação', 
        paymentReport: 'Relatório de Pagamento',
        operationCost: 'Custo da Operação',
        operationReports: 'Relatórios de Operação', 
        alerts: 'Alertas', 
        holidays: 'Feriados' 
    };

    // 🆕 DJANGO: Buscar dados via API
    const { 
        vagas: allVagas, 
        teams: allTeams, 
        convoys: allConvoys, 
        allUsers, 
        loading: djangoLoading,
        error: djangoError,
        refresh: refreshDjangoData 
    } = useAdminDataDjango();

    // Filtrar por semana atual (Django retorna todos, Firebase filtrava no query)
    const vagas = allVagas.filter(v => v.weekId === currentWeek.weekId);
    const teams = allTeams.filter(t => t.weekId === currentWeek.weekId);
    const convoys = allConvoys.filter(c => c.weekId === currentWeek.weekId);

    // Loading combinado
    const loading = djangoLoading;

    // 🔥 FIREBASE: Holidays (ainda não migrado)
    useEffect(() => {
        const unsubHolidays = onSnapshot(
            collection(db, `/artifacts/${appId}/public/data/holidays`), 
            snap => {
                setHolidays(snap.docs.map(d => new Date(d.data().date.seconds * 1000).toDateString()));
            }
        );
        return () => unsubHolidays();
    }, []);

    // Atualizar quando mudar a semana
    useEffect(() => {
        refreshDjangoData();
    }, [currentWeek, refreshDjangoData]);

    // Mostrar erro se houver
    useEffect(() => {
        if (djangoError) {
            showNotification(`Erro ao carregar dados: ${djangoError}`, 'error');
        }
    }, [djangoError, showNotification]);

    // 🔥 FIREBASE: generateWeeklyVagas (ainda usa Firebase)
    const generateWeeklyVagas = async (vagasConfig) => {
        setIsVagasModalOpen(false);
        showNotification("Gerando vagas, por favor aguarde...", "info");
        
        try {
            const batch = writeBatch(db);
            const weekId = currentWeek.weekId;

            currentWeek.weekDays.forEach((day, index) => {
                const { day: dayVagas, night: nightVagas } = vagasConfig[index];
                const cycleId = getCycleInfo(day).cycleId;

                for (let i = 0; i < dayVagas; i++) {
                    const vagaRef = doc(collection(db, `/artifacts/${appId}/public/data/vagas`));
                    batch.set(vagaRef, {
                        vagaDate: day,
                        turno: 'Dia',
                        disponivel: true,
                        weekId: weekId,
                        cycleId: cycleId,
                        createdAt: new Date()
                    });
                }

                for (let i = 0; i < nightVagas; i++) {
                    const vagaRef = doc(collection(db, `/artifacts/${appId}/public/data/vagas`));
                    batch.set(vagaRef, {
                        vagaDate: day,
                        turno: 'Noite',
                        disponivel: true,
                        weekId: weekId,
                        cycleId: cycleId,
                        createdAt: new Date()
                    });
                }
            });

            await batch.commit();
            showNotification(`✅ Vagas geradas com sucesso para a semana ${weekId}!`, "success");
            
            // Atualizar dados do Django
            setTimeout(refreshDjangoData, 1000);
        } catch (error) {
            console.error("Erro ao gerar vagas:", error);
            showNotification("❌ Erro ao gerar vagas. Tente novamente.", "error");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {viewNames[view] || 'Dashboard'}
                    </h1>
                    <p className="text-gray-600">Semana: {currentWeek.weekId}</p>
                </div>
                
                {view === 'dashboard' && (
                    <button 
                        onClick={() => setIsVagasModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <PlusCircle size={20} />
                        Gerar Vagas
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {Object.keys(viewNames).map(key => (
                    <button 
                        key={key}
                        onClick={() => setView(key)}
                        className={`px-4 py-2 rounded-lg transition ${
                            view === key 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {viewNames[key]}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-900">Vagas</h3>
                            <p className="text-3xl font-bold text-blue-600">{vagas.length}</p>
                            <p className="text-sm text-gray-600">
                                {vagas.filter(v => v.disponivel).length} disponíveis
                            </p>
                        </div>
                        
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-900">Equipes</h3>
                            <p className="text-3xl font-bold text-green-600">{teams.length}</p>
                            <p className="text-sm text-gray-600">
                                {teams.filter(t => t.status === 'aprovada').length} aprovadas
                            </p>
                        </div>
                        
                        <div className="bg-purple-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-900">Comboios</h3>
                            <p className="text-3xl font-bold text-purple-600">{convoys.length}</p>
                            <p className="text-sm text-gray-600">
                                {convoys.filter(c => c.status === 'ativa').length} ativos
                            </p>
                        </div>
                    </div>
                )}

                {view === 'ranking' && <RankingView />}
                {view === 'schedule' && (
                    <ScheduleManagementView 
                        vagas={vagas}
                        teams={teams}
                        allUsers={allUsers}
                        currentWeek={currentWeek}
                        showNotification={showNotification}
                    />
                )}
                {view === 'convoys' && (
                    <ConvoyManagementView
                        teams={teams}
                        convoys={convoys}
                        weekId={currentWeek.weekId}
                        showNotification={showNotification}
                    />
                )}
                {view === 'paymentReport' && (
                    <PaymentReportView
                        allUsers={allUsers}
                        showNotification={showNotification}
                    />
                )}
                {view === 'operationCost' && <OperationCostView />}
                {view === 'operationReports' && (
                    <OperationReportsView showNotification={showNotification} />
                )}
                {view === 'alerts' && (
                    <AlertsView 
                        showNotification={showNotification}
                        setView={setView}
                        setCurrentWeek={setCurrentWeek}
                    />
                )}
                {view === 'holidays' && (
                    <HolidayManagementView showNotification={showNotification} />
                )}
            </div>

            {/* Modal de Geração de Vagas */}
            {isVagasModalOpen && (
                <Modal onDismiss={() => setIsVagasModalOpen(false)}>
                    <GenerateVagasForm 
                        currentWeek={currentWeek}
                        onSubmit={generateWeeklyVagas}
                        onCancel={() => setIsVagasModalOpen(false)}
                        holidays={holidays}
                    />
                </Modal>
            )}
        </div>
    );
}
