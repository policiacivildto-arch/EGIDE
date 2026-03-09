// src/views/admin/components/HolidayManagementView.js
import React, { useState } from 'react';
import { apiClient } from '../../../config/api';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { Trash2 } from 'lucide-react';
import { normalizeName } from '../../../utils/helpers';
import { useEffect } from "react";  
    
export const HolidayManagementView = ({ showNotification }) => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [holidayName, setHolidayName] = useState('');
    const [holidayDate, setHolidayDate] = useState('');
    useEffect(() => {
        const loadHolidays = async () => {
            try {
                const holidaysData = await apiClient.getHolidays();
                const sortedHolidays = (Array.isArray(holidaysData) ? holidaysData : [])
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                setHolidays(sortedHolidays);
            } catch (error) {
                console.error('Erro ao carregar feriados:', error);
            } finally {
                setLoading(false);
            }
        };
        loadHolidays();
        
        // Atualiza a cada 30 segundos
        const interval = setInterval(loadHolidays, 30000);
        return () => clearInterval(interval);
    }, []);
    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!holidayName || !holidayDate) { showNotification("Preencha o nome e a data do feriado.", "error"); return; }
        try {
            await apiClient.createHoliday({
                name: normalizeName(holidayName),
                date: holidayDate
            });
            showNotification("Feriado adicionado!", "success");
            
            // Recarrega lista
            const holidaysData = await apiClient.getHolidays();
            const sortedHolidays = (Array.isArray(holidaysData) ? holidaysData : [])
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            setHolidays(sortedHolidays);
            
            setHolidayName('');
            setHolidayDate('');
        } catch (error) {
            console.error('Erro ao adicionar feriado:', error);
            showNotification("Erro ao adicionar feriado.", "error");
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja remover este feriado?")) {
            try {
                await apiClient.deleteHoliday(id);
                showNotification("Feriado removido.", "success");
                
                // Recarrega lista
                const holidaysData = await apiClient.getHolidays();
                const sortedHolidays = (Array.isArray(holidaysData) ? holidaysData : [])
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                setHolidays(sortedHolidays);
            } catch (error) {
                console.error('Erro ao remover feriado:', error);
                showNotification("Erro ao remover feriado.", "error");
            }
        }
    }
    if (loading) return <LoadingSpinner />;
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Cadastro de Feriados</h3>
            <form onSubmit={handleAddHoliday} className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div className="flex-grow"><label className="block text-sm font-bold mb-1">Nome do Feriado</label><input type="text" value={holidayName} onChange={e => setHolidayName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div className="flex-grow"><label className="block text-sm font-bold mb-1">Data</label><input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
            </form>
            <div className="bg-gray-800 p-4 rounded-lg"><h4 className="text-xl font-bold mb-2">Feriados Cadastrados</h4><div className="space-y-2">
                {holidays.map(h => (<div key={h.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50"><span>{h.name} - {new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span><button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-200"><Trash2 size={16} /></button></div>))}
            </div></div>
        </div>
    );
};