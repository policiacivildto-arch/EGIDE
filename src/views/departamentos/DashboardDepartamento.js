import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';      
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

/**
 * Dashboard de Departamento - Sistema EGIDE
 * Mesmas funcionalidades do Admin, mas filtradas por departamento
 */
export default function DashboardDepartamento({ userData, showNotification }) {
    const [view, setView] = useState('dashboard');
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

    // Carregar usuários e feriados
    useEffect(() => {
        const unsubUsers = onSnapshot(
            query(collection(db, `/artifacts/${appId}/users`), where("departamento", "==", userDepartamento)), 
            snap => {
                setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );
        
        const unsubHolidays = onSnapshot(
            collection(db, `/artifacts/${appId}/public/data/holidays`), 
            snap => {
                setHolidays(snap.docs.map(d => new Date(d.data().date.seconds * 1000).toDateString()));
            }
        );
        
        return () => {
            unsubUsers();
            unsubHolidays();
        };
    }, [userDepartamento]);

    // Carregar dados da semana filtrados por departamento
    useEffect(() => {
        setLoading(true);
        
        const unsubscribes = [
            onSnapshot(
                query(
                    collection(db, `/artifacts/${appId}/public/data/vagas`), 
                    where("weekId", "==", currentWeek.weekId),
                    where("departamento", "==", userDepartamento)
                ), 
                snap => setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            ),
            onSnapshot(
                query(
                    collection(db, `/artifacts/${appId}/public/data/teams`), 
                    where("weekId", "==", currentWeek.weekId),
                    where("departamento", "==", userDepartamento)
                ), 
                snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            ),
            onSnapshot(
                query(
                    collection(db, `/artifacts/${appId}/public/data/convoys`), 
                    where("weekId", "==", currentWeek.weekId),
                    where("departamento", "==", userDepartamento)
                ), 
                snap => { 
                    setConvoys(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
                    setLoading(false);
                }
            )
        ];
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [currentWeek, userDepartamento]);

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
                        date: day, 
                        weekId, 
                        cycleId, 
                        shiftType: 'day', 
                        status: 'Disponível', 
                        teamId: '',
                        departamento: userDepartamento 
                    });
                }
                for (let i = 0; i < nightVagas; i++) {
                    const vagaRef = doc(collection(db, `/artifacts/${appId}/public/data/vagas`));
                    batch.set(vagaRef, { 
                        date: day, 
                        weekId, 
                        cycleId, 
                        shiftType: 'night', 
                        status: 'Disponível', 
                        teamId: '',
                        departamento: userDepartamento 
                    });
                }
            });

            await batch.commit();
            showNotification("Vagas da semana geradas com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao gerar vagas:", error);
            showNotification("Falha ao gerar vagas.", "error");
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
                        <ChevronDown className="-rotate-90" />
                    </button>
                    <div className="text-center">
                        <span className="font-semibold text-lg text-white">
                            {`Semana de ${currentWeek.weekDays[0].toLocaleDateString('pt-BR')} a ${currentWeek.weekDays[6].toLocaleDateString('pt-BR')}`}
                        </span>
                        <span className="text-xs block text-gray-400"> (Semana {currentWeek.weekId.split('-W')[1]})</span>
                    </div>
                    <button onClick={goToNextWeek} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Próxima Semana">
                        <ChevronUp className="rotate-90" />
                    </button>
                </div>

                <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                    {Object.keys(viewNames).map(v => 
                        <button 
                            key={v} 
                            onClick={() => setView(v)} 
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
                    {view === 'alerts' && <AlertsView showNotification={showNotification} setView={setView} setCurrentWeek={setCurrentWeek} departamento={userDepartamento} />}
                    {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
                </>
            )}
        </div>
    );
}
