// src/views/admin/components/HolidayManagementView.js
import React, { useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';
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
        const q = query(collection(db, `/artifacts/${appId}/public/data/holidays`));
        const unsub = onSnapshot(q, snap => { setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.seconds - b.date.seconds)); setLoading(false); });
        return () => unsub();
    }, []);
    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!holidayName || !holidayDate) { showNotification("Preencha o nome e a data do feriado.", "error"); return; }
        // Adiciona 1 dia para corrigir a conversão de fuso horário que o input[type=date] causa
        const correctedDate = new Date(new Date(holidayDate).valueOf() + 86400000);
        await addDoc(collection(db, `/artifacts/${appId}/public/data/holidays`), { name: normalizeName(holidayName), date: correctedDate });
        showNotification("Feriado adicionado!", "success");
        setHolidayName(''); setHolidayDate('');
    };
    const handleDelete = async (id) => { if (window.confirm("Tem certeza que deseja remover este feriado?")) { await deleteDoc(doc(db, `/artifacts/${appId}/public/data/holidays`, id)); showNotification("Feriado removido.", "success"); } }
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
                {holidays.map(h => (<div key={h.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50"><span>{h.name} - {new Date(h.date.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span><button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-200"><Trash2 size={16} /></button></div>))}
            </div></div>
        </div>
    );
};