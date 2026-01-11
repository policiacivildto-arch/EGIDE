import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';      
import { getWeekInfo, getCycleInfo } from '../../utils/helpers';
import { LoadingSpinner, Modal } from '../../components/ui/Shared';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
// Modal is imported above from components/ui/Shared
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
import { CadastroRapidoView } from './components/CadastroRapidoView';
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
    cadastro: 'Cadastro Rápido',
    ranking: 'Ranking',
    schedule: 'Escalas', 
    convoys: 'Criação da Operação', 
    paymentReport: 'Relatório de Pagamento',
    operationCost: 'Custo da Operação',
    operationReports: 'Relatórios de Operação', 
    alerts: 'Alertas', 
    holidays: 'Feriados' 
};
// Roda apenas uma vez quando o componente é montado.
useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, `/artifacts/${appId}/users`)), snap => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubHolidays = onSnapshot(collection(db, `/artifacts/${appId}/public/data/holidays`), snap => {
        setHolidays(snap.docs.map(d => new Date(d.data().date.seconds * 1000).toDateString()));
    });
    return () => {
        unsubUsers();
        unsubHolidays();
    };
}, []); // <-- Array de dependência VAZIO

useEffect(() => {
    setLoading(true);
    const unsubscribes = [
        onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/vagas`), where("weekId", "==", currentWeek.weekId)), snap => setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/teams`), where("weekId", "==", currentWeek.weekId)), snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/convoys`), where("weekId", "==", currentWeek.weekId)), snap => { 
            setConvoys(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
            setLoading(false); // Mova o setLoading(false) para a última busca
        })
    ];
    return () => unsubscribes.forEach(unsub => unsub());
}, [currentWeek]); // <-- Dependência CORRETA

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
                    batch.set(vagaRef, { date: day, weekId, cycleId, shiftType: 'day', status: 'Disponível', teamId: '' });
                }
                for (let i = 0; i < nightVagas; i++) {
                    const vagaRef = doc(collection(db, `/artifacts/${appId}/public/data/vagas`));
                    batch.set(vagaRef, { date: day, weekId, cycleId, shiftType: 'night', status: 'Disponível', teamId: '' });
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

            {/* Este div pai controla o espaçamento superior e lateral */}
            <div className="mb-6"> 
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h2 className="text-3xl font-bold text-blue-400 mb-4 sm:mb-0">Painel do Administrador</h2>
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
                    {Object.keys(viewNames).map(v => <button key={v} onClick={() => setView(v)} className={`py-2 px-4 whitespace-nowrap capitalize ${view === v ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>{viewNames[v]}</button>)}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <>
                    {view === 'dashboard' && <ReportsDashboardView showNotification={showNotification} />}
                    {view === 'cadastro' && <CadastroRapidoView showNotification={showNotification} />}
                    {view === 'ranking' && <RankingView showNotification={showNotification} />}
                    {view === 'schedule' && <ScheduleManagementView vagas={vagas} teams={teams} allUsers={allUsers} showNotification={showNotification} weekId={currentWeek.weekId} />}
                    {view === 'convoys' && <ConvoyManagementView teams={teams} convoys={convoys} weekId={currentWeek.weekId} showNotification={showNotification} />}
                    {view === 'paymentReport' && <PaymentReportView allUsers={allUsers} showNotification={showNotification} />}
                    {view === 'operationCost' && <OperationCostView allUsers={allUsers} holidays={holidays} showNotification={showNotification} />}
                    {view === 'operationReports' && <OperationReportsView showNotification={showNotification} />}
                    {view === 'alerts' && <AlertsView showNotification={showNotification}setView={setView} setCurrentWeek={setCurrentWeek} />}
                    {view === 'users' && <UserManagementView userData={userData} showNotification={showNotification} />}
                    {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
                </>
            )}
        </div>
    );
}
