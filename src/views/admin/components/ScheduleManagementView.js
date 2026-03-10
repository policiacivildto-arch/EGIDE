
import React, { useState, useMemo } from 'react';
import { apiClient } from '../../../config/api';
import { getCycleInfo, displayMatricula } from '../../../utils/helpers';

import { Modal } from '../../../components/ui/Shared';
import { ChevronDown, ChevronUp, PlusCircle, CheckSquare, XSquare, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { AdminRegistrationForm } from './AdminRegistrationForm';
import { AdminEditTeamModal } from './AdminEditTeamModal';
import { checkWeeklyLimit } from '../../../utils/helpers'; 

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch) {
      return new Date(`${isoDateMatch[1]}T12:00:00`);
    }
    return new Date(value);
  }
  if (value?.seconds) return new Date(value.seconds * 1000);
  return null;
};

const resolveVagaDate = (vaga) => parseDate(vaga?.date || vaga?.data);

    
export const ScheduleManagementView = ({ vagas, teams, allUsers, showNotification, weekId, departamento }) => {
    const [expandedRows, setExpandedRows] = useState([]);
    const [modalContent, setModalContent] = useState(null);
    const [editingTeam, setEditingTeam] = useState(null);

  const getVagaCapacity = (vaga) => Math.max(1, Number(vaga?.posicoes_disponiveis || 1));

  const getTeamsForVaga = (vagaId) => teams.filter((t) => Number(resolveTeamVagaId(t)) === Number(vagaId));

  const getRemainingSlots = (vaga) => {
    const capacity = getVagaCapacity(vaga);
    const used = getTeamsForVaga(vaga?.id).length;
    return Math.max(0, capacity - used);
  };

  const resolveVagaShift = (vaga) => vaga?.shiftType || vaga?.turno;

  const resolveTeamVagaId = (team) => team?.vagaId || team?.vaga || team?.vaga_info?.id;

  const resolveTeamLeadName = (team) => team?.registeringOfficer?.nome || team?.chefe_nome || '---';

  const resolveTeamLeadPhone = (team) => team?.chefeEquipeTelefone || team?.telefone_contato || 'Não informado';

  const resolveTeamMembers = (team) => {
    if (Array.isArray(team?.members) && team.members.length > 0) return team.members;
    if (Array.isArray(team?.membros_detalhes) && team.membros_detalhes.length > 0) {
      return team.membros_detalhes.map((m) => ({
        uid: m.id,
        nome: m.nome,
        matricula: m.matricula,
        delegacia: m.delegacia_nome,
      }));
    }
    if (team?.chefe_nome) {
      return [{
        uid: team?.chefe,
        nome: team.chefe_nome,
        matricula: '',
        delegacia: team?.vaga_info?.delegacia_nome || '',
      }];
    }
    return [];
  };

    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleConfirmTeam = async (teamId) => {
        if (!window.confirm("Tem certeza que deseja confirmar esta equipe?")) return;
        try {
      await apiClient.updateTeam(teamId, { status: 'Aprovada' });
            showNotification("Equipe confirmada com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao confirmar equipe:", error);
            showNotification("Falha ao confirmar a equipe.", "error");
        }
    };

    const handleRejectTeam = async (team) => {
        if (!window.confirm("Tem certeza que deseja RECUSAR esta equipe? A vaga voltará a ficar disponível.")) return;
        try {
        await apiClient.deleteTeam(team.id);
        const vagaId = resolveTeamVagaId(team);
        if (vagaId) {
          const refreshedTeams = await apiClient.getTeams({ vaga: vagaId });
          const teamsForVaga = Array.isArray(refreshedTeams) ? refreshedTeams : (refreshedTeams?.results || []);
          const vagaRef = vagas.find((v) => Number(v?.id) === Number(vagaId));
          const capacity = Math.max(1, Number(vagaRef?.posicoes_disponiveis || 1));
          const nextStatus = teamsForVaga.length >= capacity ? 'Ocupada' : 'Disponível';
          await apiClient.updateVaga(vagaId, { status: nextStatus });
        }
            showNotification("Inscrição da equipe recusada com sucesso. A vaga está disponível novamente.", "success");
        } catch (error) {
            console.error("Erro ao recusar equipe:", error);
            showNotification("Falha ao recusar a inscrição.", "error");
        }
    };

    const handleUpdateTeam = async (teamId, updatedData) => {
        try {
            await apiClient.updateTeam(teamId, updatedData);
            showNotification("Equipe atualizada com sucesso!", "success");
            setEditingTeam(null);
        } catch (error) {
            console.error("Erro ao atualizar a equipe:", error);
            showNotification("Falha ao atualizar a equipe.", "error");
            throw error;
        }
    };
const handleConfirmConflict = async (teamId) => {
     if (!window.confirm("Confirmar esta equipe mesmo com o conflito de escala dupla identificado?")) return;
     try {
   await apiClient.updateTeam(teamId, { status: 'Aprovada' });
         showNotification("Conflito ignorado e equipe confirmada!", "success");
     } catch (error) {
         console.error("Erro ao confirmar conflito:", error);
         showNotification("Falha ao confirmar a equipe.", "error");
     }
};
    const handleDeleteTeam = async (team) => {
        if (!window.confirm("Tem certeza que deseja remover esta equipe da escala? A ação não pode ser desfeita.")) return;
        try {
            await apiClient.deleteTeam(team.id);
      const vagaId = resolveTeamVagaId(team);
      if (vagaId) {
        const refreshedTeams = await apiClient.getTeams({ vaga: vagaId });
        const teamsForVaga = Array.isArray(refreshedTeams) ? refreshedTeams : (refreshedTeams?.results || []);
        const vagaRef = vagas.find((v) => Number(v?.id) === Number(vagaId));
        const capacity = Math.max(1, Number(vagaRef?.posicoes_disponiveis || 1));
        const nextStatus = teamsForVaga.length >= capacity ? 'Ocupada' : 'Disponível';
        await apiClient.updateVaga(vagaId, { status: nextStatus });
      }
            showNotification("Equipe removida com sucesso.", "success");
        } catch (error) {
            console.error("Erro ao remover equipe:", error);
            showNotification("Falha ao remover equipe.", "error");
        }
    };

   // DENTRO de ScheduleManagementView
const handleAdminRegister = async (vaga, teamData) => {
  const vagaWeekId = vaga.weekId || weekId;
    const memberMatriculas = teamData.members.map(m => m.matricula);
    // Verifica conflito, mas não bloqueia
  const validation = await checkWeeklyLimit(memberMatriculas, vagaWeekId);

    let teamStatus = 'Aprovada'; // Admin registra como aprovada por padrão
    let conflictDetails = null;

    if (validation.conflict) {
        teamStatus = 'Pendente (Conflito)'; // Muda status se houver conflito
        conflictDetails = {
            officerName: validation.officerName,
            officerMatricula: validation.officerMatricula
        };
        showNotification(
            `ALERTA: ${validation.officerName} (Mat. ${displayMatricula(validation.officerMatricula)}) já está escalado(a) nesta semana. A equipe foi registrada como 'Pendente (Conflito)' para sua análise.`,
            "warning",
            8000
        );
    }

    try {
        const leader = teamData.members.find((member) => String(member.uid) === String(teamData.leaderUid));
      if (!leader) {
        showNotification("Selecione um líder da equipe.", "error");
        return;
      }

      const leaderPolicialId = leader.id || leader.uid;
      const membrosIds = teamData.members
        .map((member) => member.id || member.uid)
        .filter(Boolean);

      const vagaDate = resolveVagaDate(vaga);
        const team = {
        vaga: vaga.id,
        chefe: leaderPolicialId,
        membros: membrosIds,
            status: teamStatus,
        viatura: null,
        telefone_contato: leader?.telefone || '',
        observacoes: conflictDetails
          ? `Conflito de escala: ${conflictDetails.officerName} (${conflictDetails.officerMatricula})`
          : `Viatura: ${teamData.vehicle}${vagaDate ? ` | Ciclo ${getCycleInfo(vagaDate).cycleId}` : ''}${departamento ? ` | Departamento: ${departamento}` : ''}`,
        };
      await apiClient.createTeam(team);

      const refreshedTeams = await apiClient.getTeams({ vaga: vaga.id });
      const teamsForVaga = Array.isArray(refreshedTeams) ? refreshedTeams : (refreshedTeams?.results || []);
      const capacity = getVagaCapacity(vaga);
      const nextStatus = teamsForVaga.length >= capacity ? 'Ocupada' : 'Disponível';
      await apiClient.updateVaga(vaga.id, { status: nextStatus });

        // --- ALTERAÇÃO: Notificação condicional ---
        if (teamStatus === 'Pendente (Conflito)') {
            // Aviso já foi mostrado
        } else {
             showNotification("Equipe registrada e confirmada com sucesso!", "success");
        }
        setModalContent(null);
    } catch (error) {
        console.error(error);
        showNotification("Falha ao registrar equipe.", "error");
    }
};
    const vagasByDay = useMemo(() => {
        return vagas.reduce((acc, vaga) => { 
            const parsedDate = resolveVagaDate(vaga);
            if (!parsedDate || Number.isNaN(parsedDate.getTime())) return acc;
            const dayKey = parsedDate.toDateString(); 
            if (!acc[dayKey]) acc[dayKey] = []; 
            acc[dayKey].push(vaga); 
            return acc; 
        }, {});
    }, [vagas]);

    const sortedDays = useMemo(() => Object.keys(vagasByDay).sort((a, b) => new Date(a) - new Date(b)), [vagasByDay]);

    return (
        <div>
            {editingTeam && (
                <Modal size="3xl" onClose={() => setEditingTeam(null)}>
                    <AdminEditTeamModal 
                        teamToEdit={editingTeam} allUsers={allUsers}
                        onSave={handleUpdateTeam} onCancel={() => setEditingTeam(null)}
                        showNotification={showNotification}
                    />
                </Modal>
            )}
            
            {modalContent && <Modal size="5xl" onClose={() => setModalContent(null)}><AdminRegistrationForm vaga={modalContent.vaga} allUsers={allUsers} onSubmit={handleAdminRegister} onCancel={() => setModalContent(null)} showNotification={showNotification} /></Modal>}
            
            <h3 className="text-2xl font-bold mb-2">Visão Geral das Escalas</h3>
            
            <div className="space-y-6">
                {sortedDays.map(dayKey => {
                    const dayVagas = vagasByDay[dayKey];
                    const dayDate = new Date(dayKey);
                  const totalSlots = dayVagas.reduce((sum, v) => sum + getVagaCapacity(v), 0);
                  const preenchidas = dayVagas.reduce((sum, v) => sum + getTeamsForVaga(v.id).length, 0);
                    return (
                        <div key={dayKey} className="bg-gray-800 p-2 rounded-lg">
                            <h4 className="text-lg font-bold text-blue-400 capitalize flex justify-between mb-2">
                                <span>{dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</span>
                              <span>{preenchidas} / {totalSlots} Vagas</span>
                            </h4>
                           <div className="overflow-x-auto">
  <table className="min-w-full text-sm text-left border-collapse">
    <thead className="text-xs text-gray-400 uppercase bg-gray-900">
      <tr>
        <th className="px-3 py-3 text-center w-10"></th>
        <th className="px-4 py-3 text-center w-28">Horário</th>
        <th className="px-4 py-3 text-center w-44">Status</th>
        <th className="px-4 py-3 text-left w-64">Chefe da Equipe</th>
        <th className="px-4 py-3 text-center w-36">Ações</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-700">
      {dayVagas.sort((a, b) => {
        const turnA = resolveVagaShift(a) === 'day' ? 0 : 1;
        const turnB = resolveVagaShift(b) === 'day' ? 0 : 1;
        return turnA - turnB;
      }).map(vaga => {
        const teamsForVaga = getTeamsForVaga(vaga.id);
        const team = teamsForVaga[0];
        const capacity = getVagaCapacity(vaga);
        const used = teamsForVaga.length;
        const hasSlots = used < capacity;
        const isConflict = team?.status === 'Pendente (Conflito)';
        const isExpanded = expandedRows.includes(vaga.id);

        return (
          <React.Fragment key={vaga.id}>
            <tr
              className={`align-middle ${
                team ? 'cursor-pointer hover:bg-gray-700/40' : ''
              } ${isConflict ? 'bg-yellow-900/40 hover:bg-yellow-800/50' : ''}`}
              onClick={() => team && toggleRow(vaga.id)}
            >
              <td className="px-3 py-2 text-center w-10">
                {team && (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </td>

              <td className="px-4 py-2 text-center w-28">
                {resolveVagaShift(vaga) === 'day' ? '08h-20h' : '19h-01h'}
              </td>

              <td className="px-4 py-2 text-center w-44">
                {hasSlots ? (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">
                    Disponível ({used}/{capacity})
                  </span>
                ) : isConflict ? (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300">
                    <AlertTriangle size={12} className="mr-1" /> Pendente (Conflito)
                  </span>
                ) : team?.status === 'Em Análise' ? (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-900 text-orange-300">
                    Em Análise
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">
                    Confirmada
                  </span>
                )}
              </td>

              <td
                className="px-4 py-2 text-left w-64 whitespace-nowrap overflow-hidden text-ellipsis"
                title={team ? resolveTeamLeadName(team) : ''}
              >
                {team ? resolveTeamLeadName(team) : '---'}
              </td>

              <td className="px-4 py-2 text-center w-36 space-x-2">
                {hasSlots && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalContent({ vaga });
                    }}
                    className="text-green-400 hover:text-green-200"
                    title="Adicionar Equipe"
                  >
                    <PlusCircle size={18} />
                  </button>
                )}
                {isConflict && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeam(team);
                      }}
                      className="text-blue-400 hover:text-blue-200"
                      title="Editar Equipe"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmConflict(team.id);
                      }}
                      className="text-green-400 hover:text-green-200"
                      title="Confirmar (Ignorar Conflito)"
                    >
                      <CheckSquare size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectTeam(team);
                      }}
                      className="text-red-400 hover:text-red-200"
                      title="Rejeitar Inscrição"
                    >
                      <XSquare size={18} />
                    </button>
                  </>
                )}
                {team?.status === 'Em Análise' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeam(team);
                      }}
                      className="text-blue-400 hover:text-blue-200"
                      title="Editar Equipe"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmTeam(team.id);
                      }}
                      className="text-green-400 hover:text-green-200"
                      title="Confirmar Equipe"
                    >
                      <CheckSquare size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectTeam(team);
                      }}
                      className="text-red-400 hover:text-red-200"
                      title="Recusar Equipe"
                    >
                      <XSquare size={18} />
                    </button>
                  </>
                )}
                {team && !isConflict && team.status !== 'Em Análise' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeam(team);
                      }}
                      className="text-blue-400 hover:text-blue-200"
                      title="Editar Equipe"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team);
                      }}
                      className="text-red-400 hover:text-red-200"
                      title="Excluir Equipe"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </td>
            </tr>

            {team && isExpanded && (
              <tr className={`bg-gray-900/50 ${isConflict ? 'bg-yellow-900/30' : ''}`}>
                <td colSpan="5" className="p-3">
                  <div className="p-3 bg-gray-800 rounded-md text-xs">
                    {isConflict && team.conflictDetails && (
                      <div className="mb-2 p-2 bg-yellow-800/50 rounded border border-yellow-600 text-yellow-300">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Conflito detectado: Policial{' '}
                        <strong>{team.conflictDetails.officerName}</strong> (Mat.{' '}
                        {displayMatricula(team.conflictDetails.officerMatricula)}) já possui outra
                        escala nesta semana.
                      </div>
                    )}
                    <h5 className="font-bold mb-2 text-white">COMPONENTES DA EQUIPE:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {resolveTeamMembers(team).map((m, index) => (
                        <li key={m.uid || m.matricula || index}>
                          {m.nome} {m.matricula ? `(${displayMatricula(m.matricula)})` : ''} {m.delegacia ? `- ${m.delegacia}` : ''}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 pt-2 border-t border-gray-700">
                      <strong>Telefone do Chefe:</strong>{' '}
                      {resolveTeamLeadPhone(team)}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  </table>
</div>

                    </div>
                );
            })}
        </div>
    </div>
    );
};