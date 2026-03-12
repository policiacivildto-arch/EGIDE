import React, { useState, useMemo } from 'react';
import { normalizeName, displayMatricula } from '../../../utils/helpers';   

export const AdminEditTeamModal = ({ teamToEdit, allUsers, onSave, onCancel, showNotification }) => {
    const initialMembers = Array.isArray(teamToEdit?.members)
        ? teamToEdit.members
        : Array.isArray(teamToEdit?.membros_detalhes)
            ? teamToEdit.membros_detalhes.map((m) => ({ ...m, uid: m.id }))
            : [];
    const [members, setMembers] = useState(initialMembers);
    const [substitutingIndex, setSubstitutingIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filtra usuários disponíveis (que não estão na equipe atual)
    const availableUsers = useMemo(() => {
        const teamMemberIds = members.map(m => m.uid);
        return allUsers.filter(u => !teamMemberIds.includes(u.id));
    }, [members, allUsers]);

    const filteredUsers = searchTerm 
        ? availableUsers.filter(u => normalizeName(u.nome).includes(normalizeName(searchTerm))) 
        : availableUsers;

    const handleSubstitute = (newUser) => {
        const newMembers = [...members];
        // Mantém o campo 'telefone' do líder se ele já existir, senão busca do perfil do novo usuário
        const telefone = (substitutingIndex === 0 && members[0]?.telefone) ? members[0].telefone : newUser.telefone || '';
        newMembers[substitutingIndex] = { ...newUser, uid: newUser.id, telefone };
        
        setMembers(newMembers);
        setSubstitutingIndex(null);
        setSearchTerm('');
    };

    const handleSaveChanges = async () => {
        if (members.length === 0) {
            showNotification("Esta equipe não possui membros editáveis neste formato.", "warning");
            return;
        }
        setIsLoading(true);
        try {
            const memberIds = members.map((m) => m.id || m.uid).filter(Boolean);
            const leaderId = members[0]?.id || members[0]?.uid;

            if (!leaderId || memberIds.length === 0) {
                showNotification("Não foi possível identificar os policiais da equipe para salvar.", "error");
                return;
            }

            const updatedTeamData = {
                chefe: leaderId,
                membros: memberIds,
                telefone_contato: members[0].telefone || ''
            };
            await onSave(teamToEdit.id, updatedTeamData);
        } catch (error) {
            showNotification("Falha ao salvar as alterações.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Editar Equipe</h2>
            <p className="mb-6 text-sm text-gray-600">
                Data: <span className="font-semibold">{(() => {
                    const rawDate = teamToEdit?.vagaDate || teamToEdit?.vaga_info?.data;
                    if (!rawDate) return 'N/A';
                    if (typeof rawDate === 'string') {
                        const isoDateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawDate);
                        if (isoDateMatch) return new Date(`${isoDateMatch[1]}T12:00:00`).toLocaleDateString('pt-BR');
                        return new Date(rawDate).toLocaleDateString('pt-BR');
                    }
                    if (rawDate?.seconds) return new Date(rawDate.seconds * 1000).toLocaleDateString('pt-BR');
                    return 'N/A';
                })()}</span> | 
                Viatura: <span className="font-semibold">{teamToEdit.vehicle || teamToEdit.viatura_placa || 'N/A'}</span>
            </p>

            {substitutingIndex !== null ? (
                <div className="mb-4 p-4 border rounded-lg bg-white animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Substituir {members[substitutingIndex]?.nome}</h3>
                    <input type="text" placeholder="Pesquisar policial por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md" autoFocus/>
                    {searchTerm && (
                        <div className="border max-h-40 overflow-y-auto mt-1 rounded-md">
                            {filteredUsers.slice(0, 10).map(u => (
                                <div key={u.id} onClick={() => handleSubstitute(u)} className="p-2 hover:bg-gray-200 cursor-pointer">
                                    {u.nome} ({displayMatricula(u.matricula)})
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <div className="p-2 text-gray-500">Nenhum policial encontrado.</div>}
                        </div>
                    )}
                    <button onClick={() => setSubstitutingIndex(null)} className="text-sm text-red-600 mt-2 hover:underline">Cancelar Substituição</button>
                </div>
            ) : (
                <div className="mb-4 p-4 border rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2">Membros da Equipe</h3>
                    <div className="space-y-2">
                        {members.length === 0 && (
                            <div className="p-2 bg-yellow-100 rounded text-yellow-800">
                                Não há membros detalhados disponíveis para edição nesta equipe.
                            </div>
                        )}
                        {members.map((member, index) => (
                            <div key={member.uid || index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                <span className="font-medium">
                                    {index === 0 && <span className="text-blue-600 font-bold">Chefe: </span>}
                                    {member.nome} ({displayMatricula(member.matricula)})
                                </span>
                                <button onClick={() => setSubstitutingIndex(index)} className="text-sm bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 transition-colors font-semibold">
                                    Substituir
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                <button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="button" onClick={handleSaveChanges} disabled={isLoading} className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:bg-blue-400">
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};