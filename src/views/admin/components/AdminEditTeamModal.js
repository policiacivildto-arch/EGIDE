import React, { useState, useMemo } from 'react';
import { normalizeName, displayMatricula } from '../../../utils/helpers';   

export const AdminEditTeamModal = ({ teamToEdit, allUsers, onSave, onCancel, showNotification }) => {
    const [members, setMembers] = useState([...teamToEdit.members]);
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
        setIsLoading(true);
        try {
            const updatedTeamData = {
                members: members,
                memberMatriculas: members.map(m => m.matricula),
                registeringOfficer: members[0], // O primeiro é sempre o chefe
                delegaciaPrincipal: members[0].delegacia,
                chefeEquipeTelefone: members[0].telefone || ''
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
                Data: <span className="font-semibold">{new Date(teamToEdit.vagaDate.seconds * 1000).toLocaleDateString('pt-BR')}</span> | 
                Viatura: <span className="font-semibold">{teamToEdit.vehicle}</span>
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