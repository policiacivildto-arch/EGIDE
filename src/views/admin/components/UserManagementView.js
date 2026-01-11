// src/views/admin/componets/Management.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';         
import { db, appId } from '../../../config/firebase';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { UserPlus, Edit } from 'lucide-react';
import { displayMatricula } from '../../../utils/helpers';
import { Modal } from '../../../components/ui/Shared';
import { UserForm } from '../../../components/forms/UserForm';


export const UserManagementView = ({ userData, showNotification }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        if (userData?.role !== 'admin') {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, `/artifacts/${appId}/users`));
        const unsub = onSnapshot(q, (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Permission denied fetching users:", error);
            showNotification("Você não tem permissão para ver a lista de usuários.", "error");
            setLoading(false);
        });
        return () => unsub();
    }, [userData, showNotification]);

    const handleSaveUser = async (userDataToSave) => {
        const userRef = doc(db, `/artifacts/${appId}/users`, userDataToSave.id);
        await setDoc(userRef, userDataToSave, { merge: true });
        showNotification(`Policial ${editingUser ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
        setModalOpen(false);
        setEditingUser(null);
    };
    if (loading) return <LoadingSpinner />;
    return (
        <div>
            {modalOpen && <Modal onClose={() => { setModalOpen(false); setEditingUser(null); }}><UserForm user={editingUser} onSave={handleSaveUser} /></Modal>}
            <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold">Gestão de Usuários</h3><button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><UserPlus size={18} /><span>Novo Policial</span></button></div>
            <div className="overflow-x-auto bg-gray-800 rounded-lg"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-400 uppercase"><tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Matrícula</th><th className="px-4 py-2">Delegacia</th><th className="px-4 py-2">Perfil</th><th className="px-4 py-2">Ação</th></tr></thead>
                <tbody>{users.map(user => (<tr key={user.uid || user.id} className="border-b border-gray-700 hover:bg-gray-700/50"><td className="px-4 py-2">{user.nome}</td><td className="px-4 py-2">{displayMatricula(user.matricula)}</td><td className="px-4 py-2">{user.delegacia}</td><td className="px-4 py-2 capitalize">{user.role}</td><td className="px-4 py-2"><button onClick={() => { setEditingUser(user); setModalOpen(true); }} className="text-blue-400 hover:text-blue-200"><Edit size={16} /></button></td></tr>))}</tbody>
            </table></div>
        </div>
    );
};