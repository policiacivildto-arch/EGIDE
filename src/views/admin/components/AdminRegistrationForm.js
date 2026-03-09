import React, { useState } from 'react';
import { normalizeName, displayMatricula, formatPlaca } from '../../../utils/helpers';
import { UserMinus } from 'lucide-react';       
   

export const AdminRegistrationForm = ({ vaga, allUsers, onSubmit, onCancel, showNotification }) => {
    const [team, setTeam] = useState([]);
    const [vehicle, setVehicle] = useState('');
    const [leaderUid, setLeaderUid] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const availableUsers = (allUsers || []).filter(u => !team.some(tm => tm.uid === u.id));
    const filteredUsers = searchTerm ? availableUsers.filter(u => normalizeName(u.nome).includes(normalizeName(searchTerm))) : availableUsers;

    const addMember = (user) => {
        if (team.length < 4) {
            setTeam([...team, { ...user, uid: user.id }]);
            setSearchTerm('');
        } else {
            showNotification("A equipe pode ter no máximo 4 membros.", "warning");
        }
    };

    const removeMember = (uid) => {
        setTeam(team.filter(m => m.uid !== uid));
        if (String(leaderUid) === String(uid)) setLeaderUid('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (team.length === 0 || !leaderUid || !vehicle) {
            showNotification("Preencha todos os campos: adicione membros, defina um líder e informe a viatura.", "error");
            return;
        }
        onSubmit(vaga, { members: team, vehicle, leaderUid });
    };

    const vagaDate = (() => {
        const rawDate = vaga?.date || vaga?.data;
        if (!rawDate) return new Date();
        if (typeof rawDate === 'string') {
            const isoDateMatch = rawDate.match(/^(\d{4}-\d{2}-\d{2})/);
            if (isoDateMatch) return new Date(`${isoDateMatch[1]}T12:00:00`);
            return new Date(rawDate);
        }
        if (rawDate?.seconds) return new Date(rawDate.seconds * 1000);
        return new Date();
    })();

    return (
        <form onSubmit={handleSubmit} className="text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Registrar Equipe (Admin)</h2>
            <p className="mb-6">Dia: <span className="font-semibold">{vagaDate.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span></p>

            <div className="mb-4 p-4 border rounded-lg bg-white">
                <h3 className="font-bold text-lg mb-2">Membros da Equipe</h3>
                <div className="mb-2">
                    <input type="text" placeholder="Pesquisar policial por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md" />
                    {searchTerm && <div className="border max-h-40 overflow-y-auto">{(filteredUsers || []).slice(0, 10).map(u => <div key={u.id} onClick={() => addMember(u)} className="p-2 hover:bg-gray-200 cursor-pointer">{u.nome} ({displayMatricula(u.matricula)})</div>)}</div>}
                </div>
                <div className="space-y-2">
                    {(team || []).map(member => (
                        <div key={member.uid} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                            <span>{member.nome}</span>
                            <button type="button" onClick={() => removeMember(member.uid)} className="text-red-500"><UserMinus size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4 p-4 border rounded-lg bg-white">
                <h3 className="font-bold text-lg mb-2">Definir Chefe da Equipe</h3>
                <select value={leaderUid} onChange={e => setLeaderUid(e.target.value)} className="w-full p-2 border rounded-md bg-white" required>
                    <option value="">Selecione um líder...</option>
                    {(team || []).map(m => <option key={m.uid} value={m.uid}>{m.nome}</option>)}
                </select>
            </div>

            <div className="mb-6 p-4 border rounded-lg bg-white">
                <h3 className="font-bold text-lg mb-2">Viatura</h3>
                <input type="text" placeholder="PLACA (ABC-1234)" value={vehicle} onChange={(e) => setVehicle(formatPlaca(e.target.value))} maxLength="8" className="w-full p-2 border rounded-md uppercase" required />
            </div>

            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Confirmar Registro</button>
            </div>
        </form>
    );
};