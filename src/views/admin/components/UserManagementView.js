// src/views/admin/componets/Management.js
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../config/api';
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

        const loadUsers = async () => {
            try {
                setLoading(true);
                const usersData = await apiClient.getPoliciais();
                setUsers(Array.isArray(usersData) ? usersData : []);
            } catch (error) {
                console.error("Erro ao carregar usuários:", error);
                showNotification("Erro ao carregar lista de usuários.", "error");
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
        
        // Atualiza lista a cada 20 segundos
        const interval = setInterval(loadUsers, 20000);
        return () => clearInterval(interval);
    }, [userData, showNotification]);

    const handleSaveUser = async (userDataToSave) => {
        try {
            if (editingUser) {
                // Atualiza usuário existente
                await apiClient.updatePolicial(userDataToSave.id, userDataToSave);
                showNotification('Policial atualizado com sucesso!', 'success');
            } else {
                // Cria novo usuário
                await apiClient.createPolicial(userDataToSave);
                showNotification('Policial cadastrado com sucesso!', 'success');
            }
            
            // Recarrega lista
            const usersData = await apiClient.getPoliciais();
            setUsers(Array.isArray(usersData) ? usersData : []);
            
            setModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            showNotification(`Erro ao ${editingUser ? 'atualizar' : 'cadastrar'} policial.`, 'error');
        }
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