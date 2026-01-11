import React, { useState, useEffect, useMemo } from 'react';
import ReactCalendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { collection, query, where, onSnapshot, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';
import { Modal, LoadingSpinner } from '../../../components/ui/Shared';
import { displayMatricula, formatMatricula, formatPlaca, formatTelefone, normalizeName } from '../../../utils/helpers';
import { findPolicialByMatricula } from '../../../constants/policiais';
import { DEPARTMENTS } from '../../../constants/data';
import { checkLeaderWeeklyLimit, checkWeeklyLimit } from '../../../utils/helpers';
import { getCycleInfo } from '../../../utils/helpers';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';



export const VagasCalendarView = ({ user, showNotification }) => {
    const [activeDate, setActiveDate] = useState(new Date());
    const [monthlyVagas, setMonthlyVagas] = useState([]);
    const [monthlyTeams, setMonthlyTeams] = useState([]);
    const [mySchedule, setMySchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    useEffect(() => {
        const fetchMonthlyData = async () => {
            if (!user || !user.matricula) {
                setLoading(false);
                return;
            }
            setLoading(true);

            const start = startOfMonth(activeDate);
            const end = endOfMonth(activeDate);

            const vagasQuery = query(
                collection(db, `/artifacts/${appId}/public/data/vagas`),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const unsubscribeVagas = onSnapshot(vagasQuery, (snapshot) => {
                const vagasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMonthlyVagas(vagasData);
                setLoading(false);
            });

            const teamsQuery = query(
                collection(db, `/artifacts/${appId}/public/data/teams`),
                where('vagaDate', '>=', start),
                where('vagaDate', '<=', end)
            );
            const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
                const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMonthlyTeams(teamsData);
            });

            return () => {
                unsubscribeVagas();
                unsubscribeTeams();
            };
        };

        fetchMonthlyData();
    }, [user, activeDate]);

    const vagasByDay = useMemo(() => {
        return monthlyVagas.reduce((acc, vaga) => {
            const dayKey = format(new Date(vaga.date.seconds * 1000), 'yyyy-MM-dd');
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(vaga);
            return acc;
        }, {});
    }, [monthlyVagas]);

    const handleRegister = async (vaga, teamData) => {
        const isAlreadyLeader = await checkLeaderWeeklyLimit(user.matricula, vaga.weekId);
        if (isAlreadyLeader) {
            showNotification(
                'Você já é o chefe de uma equipe escalada para esta semana e não pode registrar outra.',
                'error'
            );
            return;
        }

        const memberMatriculas = teamData.members.map(m => m.matricula);
        const validation = await checkWeeklyLimit(memberMatriculas, vaga.weekId);

        let teamStatus = 'Em Análise';
        let conflictDetails = null;

        if (validation.conflict) {
            teamStatus = 'Pendente (Conflito)';
            conflictDetails = {
                officerName: validation.officerName,
                officerMatricula: validation.officerMatricula,
            };
            showNotification(
                `ALERTA: ${validation.officerName} (Mat. ${displayMatricula(validation.officerMatricula)}) já está escalado(a) nesta semana. A inscrição será enviada para análise do conflito.`,
                'warning',
                8000
            );
        }

        try {
            const newTeamRef = doc(collection(db, `/artifacts/${appId}/public/data/teams`));
            const leader = teamData.members[0];
            const team = {
                id: newTeamRef.id,
                teamName: leader.delegacia,
                vagaId: vaga.id,
                vagaDate: vaga.date,
                vagaShiftType: vaga.shiftType,
                weekId: vaga.weekId,
                cycleId: getCycleInfo(new Date(vaga.date.seconds * 1000)).cycleId,
                registeringOfficer: leader,
                members: teamData.members,
                memberMatriculas: memberMatriculas,
                vehicle: teamData.vehicle,
                chefeEquipeTelefone: teamData.telefone,
                status: teamStatus,
                ...(conflictDetails && { conflictDetails }),
                delegaciaPrincipal: leader.delegacia,
            };

            const vagaDocRef = doc(db, `/artifacts/${appId}/public/data/vagas`, vaga.id);
            const batch = writeBatch(db);
            batch.set(newTeamRef, team);
            batch.update(vagaDocRef, { status: 'Ocupada', teamId: newTeamRef.id });

            await batch.commit();

            if (teamStatus !== 'Pendente (Conflito)') {
                showNotification('Equipe enviada para análise do administrador!', 'success');
            }
            setModalContent(null);

        } catch (error) {
            console.error('Erro ao registrar equipe:', error);
            showNotification('Falha ao registrar a equipe. Tente novamente.', 'error');
        }
    };

    const renderTileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayKey = format(date, 'yyyy-MM-dd');
            const vagasDoDia = vagasByDay[dayKey] || [];

            const myTeamOnThisDay = vagasDoDia
                .map(vaga => {
                    if (!vaga.teamId) return null;
                    return monthlyTeams.find(t => t.id === vaga.teamId);
                })
                .find(team => team && team.members.some(m => m.matricula === user.matricula));

            const availableVagas = vagasDoDia.filter(v => v.status === 'Disponível');

            if (myTeamOnThisDay) {
                if (myTeamOnThisDay.status === 'Em Análise') {
                    return (
                        <div className="mt-1 text-xs text-center bg-yellow-600/90 text-white rounded-md p-1 animate-fade-in">Em Análise</div>
                    );
                }
                return (
                    <div className="mt-1 text-xs text-center bg-green-600/90 text-white rounded-md p-1 animate-fade-in">Meu Turno</div>
                );
            }

            if (availableVagas.length > 0) {
                return (
                    <div className="mt-1 text-xs text-center bg-blue-600/80 text-white rounded-md p-1 animate-fade-in">{availableVagas.length} Vaga(s)</div>
                );
            }
        }
        return null;
    };

    const handleDayClick = (date) => {
        const dayKey = format(date, 'yyyy-MM-dd');
        const vagasDoDia = vagasByDay[dayKey] || [];
        const firstAvailableVaga = vagasDoDia.find(v => v.status === 'Disponível');

        if (firstAvailableVaga) {
            setModalContent({ type: 'register', vaga: firstAvailableVaga });
        } else {
            showNotification('Nenhuma vaga disponível para este dia.', 'info');
        }
    };

    const renderModalContent = () => {
        if (!modalContent) return null;
        if (modalContent.type === 'register') {
            return (
                <RegistrationForm
                    vaga={modalContent.vaga}
                    user={user}
                    onSubmit={handleRegister}
                    onCancel={() => setModalContent(null)}
                    showNotification={showNotification}
                />
            );
        }
        return null;
    };

    return (
        <div>
            {modalContent && (
                <Modal size="5xl" onClose={() => setModalContent(null)}>{renderModalContent()}</Modal>
            )}
            <h2 className="text-3xl font-bold mb-4 text-center text-blue-400">Escala e Vagas Disponíveis</h2>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg calendar-container">
                    <style>{`
                        .calendar-container .react-calendar { width: 100%; border: none; background-color: transparent; color: white; }
                        .calendar-container .react-calendar__navigation button { color: #60a5fa; font-weight: bold; }
                        .calendar-container .react-calendar__month-view__weekdays__weekday { color: #9ca3af; text-align: center; font-weight: bold; }
                        .calendar-container .react-calendar__tile { background-color: #1f2937; border-radius: 8px; border: 2px solid #374151; height: 120px; display:flex; flex-direction:column; align-items:flex-start; padding:4px; }
                    `}</style>
                    <ReactCalendar
                        onChange={setActiveDate}
                        value={activeDate}
                        onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
                        tileContent={renderTileContent}
                        onClickDay={handleDayClick}
                        locale="pt-BR"
                    />
                </div>
            )}
        </div>
    );
};
export default VagasCalendarView;
export const RegistrationForm = ({ vaga, user, onSubmit, onCancel, showNotification }) => {
    const [team, setTeam] = useState([
        { nome: user?.nome || '', matricula: user?.matricula || '', departamento: user?.departamento || '', delegacia: user?.delegacia || '', telefone: user?.telefone || '', uid: user?.uid || '' },
        { nome: '', matricula: '', departamento: '', delegacia: '' },
        { nome: '', matricula: '', departamento: '', delegacia: '' },
    ]);
    const [vehicle, setVehicle] = useState('');
    const handleMemberChange = (index, field, value) => {
        const newTeam = [...team];
        newTeam[index][field] = value;
        if (field === 'departamento') newTeam[index]['delegacia'] = '';
        if (field === 'nome') newTeam[index][field] = normalizeName(value);
        if (field === 'matricula') {
            newTeam[index][field] = formatMatricula(value);
            const found = findPolicialByMatricula(value);
            if (found) {
                newTeam[index]['nome'] = found.nome;
                // Optionally set department/cargo if available
                if (found.cargo) newTeam[index]['departamento'] = found.cargo;
            }
        }
        if (field === 'telefone') newTeam[index][field] = formatTelefone(value);
        setTeam(newTeam);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const finalTeam = team.map(m => ({ ...m, matricula: formatMatricula(m.matricula) }));
        if (finalTeam.some(m => !m.nome || m.matricula.length < 7 || !m.delegacia) || !vehicle || team[0].telefone.replace(/\D/g, '').length < 10) {
            showNotification("Preencha todos os campos da equipe, incluindo telefone válido do líder e placa da viatura.", "error");
            return;
        }
        onSubmit(vaga, { members: finalTeam, vehicle, telefone: team[0].telefone });
    };
    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Equipe para Serviço</h2>
            <p className="mb-6 text-gray-600">Dia: <span className="font-semibold">{new Date(vaga.date.seconds * 1000).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span></p>
            {team.map((member, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2 text-gray-700">Componente {index + 1} {index === 0 ? "(Chefe da Equipe)" : ""}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="NOME COMPLETO" value={member.nome} onChange={(e) => handleMemberChange(index, 'nome', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 uppercase" required />
                        <div><input type="text" placeholder="MATRÍCULA" value={member.matricula} onChange={(e) => handleMemberChange(index, 'matricula', e.target.value)} maxLength="8" className="w-full p-2 border rounded-md text-gray-800" required /><small className="text-gray-500">Formato final: {displayMatricula(member.matricula)}</small></div>
                        <select value={member.departamento} onChange={(e) => handleMemberChange(index, 'departamento', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required><option value="">SELECIONE O DEPARTAMENTO</option>{Object.keys(DEPARTMENTS).map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                        <select value={member.delegacia} onChange={(e) => handleMemberChange(index, 'delegacia', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required disabled={!member.departamento}><option value="">SELECIONE A DELEGACIA</option>{member.departamento && DEPARTMENTS[member.departamento].map(del => <option key={del} value={del}>{del}</option>)}</select>
                        {index === 0 && <div><label className="block text-sm font-medium text-gray-700">Telefone do Chefe da Equipe</label><input type="tel" placeholder="(XX) XXXXX-XXXX" value={member.telefone} onChange={(e) => handleMemberChange(index, 'telefone', e.target.value)} maxLength="15" className="w-full p-2 border rounded-md text-gray-800" required /></div>}
                    </div>
                </div>
            ))}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white"><h3 className="font-bold text-lg mb-2 text-gray-700">Viatura</h3><input type="text" placeholder="PLACA (ABC-1234)" value={vehicle} onChange={(e) => setVehicle(formatPlaca(e.target.value))} maxLength="8" className="w-full p-2 border rounded-md text-gray-800 uppercase" required /></div>
            <div className="flex justify-end space-x-4"><button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button><button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Confirmar Registro</button></div>
        </form>
    );
};