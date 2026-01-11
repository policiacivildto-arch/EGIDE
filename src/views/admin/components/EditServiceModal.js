import React, { useState } from 'react';
import { normalizeName, displayMatricula } from '../../../utils/helpers';   
export default function EditServiceModal({ service, allUsers, onSave, onCancel, showNotification }) {
    const [members, setMembers] = useState(service.members);
    const [horarioEntrada, setHorarioEntrada] = useState(service.horarioEntrada || (service.vagaShiftType === 'day' ? '08:00' : '19:00'));
    const [horarioSaida, setHorarioSaida] = useState(service.horarioSaida || (service.vagaShiftType === 'day' ? '20:00' : '01:00'));
    const [paymentStatus, setPaymentStatus] = useState(service.paymentStatus || 'pending');
    const [substitutingIndex, setSubstitutingIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const availableUsers = allUsers.filter(u => !members.some(m => m.uid === u.id));
    const filteredUsers = searchTerm ? availableUsers.filter(u => normalizeName(u.nome).includes(normalizeName(searchTerm))) : availableUsers;

    const handleSubstitute = (newUser) => {
        const newMembers = [...members];
        newMembers[substitutingIndex] = { ...newUser, uid: newUser.id }; // Adiciona o UID para consistência
        setMembers(newMembers);
        setSubstitutingIndex(null);
        setSearchTerm('');
    };

    const handleSave = () => {
        const updatedService = {
            ...service,
            members,
            memberMatriculas: members.map(m => m.matricula),
            registeringOfficer: members[0], // Assume que o primeiro é sempre o chefe
            horarioEntrada,
            horarioSaida,
            paymentStatus,
        };
        onSave(updatedService);
    };

    return (
        <div className="text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Editar Serviço</h2>
            <p className="mb-6">Data: <span className="font-semibold">{new Date(service.vagaDate.seconds * 1000).toLocaleDateString('pt-BR')}</span> | Viatura: <span className="font-semibold">{service.vehicle}</span></p>

            {/* Seção de Substituição de Policial */}
            {substitutingIndex !== null ? (
                <div className="mb-4 p-4 border rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2">Substituir {members[substitutingIndex]?.nome}</h3>
                    <input type="text" placeholder="Pesquisar policial por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md" />
                    {searchTerm && <div className="border max-h-40 overflow-y-auto">{filteredUsers.slice(0, 10).map(u => <div key={u.id} onClick={() => handleSubstitute(u)} className="p-2 hover:bg-gray-200 cursor-pointer">{u.nome} ({displayMatricula(u.matricula)})</div>)}</div>}
                    <button onClick={() => setSubstitutingIndex(null)} className="text-sm text-red-600 mt-2">Cancelar Substituição</button>
                </div>
            ) : (
                <div className="mb-4 p-4 border rounded-lg bg-white">
                     <h3 className="font-bold text-lg mb-2">Membros da Equipe</h3>
                     {members.map((member, index) => (
                         <div key={member.uid || index} className="flex justify-between items-center p-2 bg-gray-100 rounded mb-2">
                            <span>{index === 0 ? 'Chefe: ' : ''}{member.nome} ({displayMatricula(member.matricula)})</span>
                            <button onClick={() => setSubstitutingIndex(index)} className="text-sm bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600">Substituir</button>
                         </div>
                     ))}
                </div>
            )}
            
            {/* Seção de Horários e Status */}
            <div className="mb-4 p-4 border rounded-lg bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div><label className="font-semibold block">Horário de Entrada</label><input type="time" value={horarioEntrada} onChange={e => setHorarioEntrada(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                 <div><label className="font-semibold block">Horário de Saída</label><input type="time" value={horarioSaida} onChange={e => setHorarioSaida(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                 <div><label className="font-semibold block">Status do Pagamento</label>
                    <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="paid">Pago</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
                <button onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button onClick={handleSave} className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Salvar Alterações</button>
            </div>
        </div>
    );
}