import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { apiClient } from '../../../config/api';
    
export const GenerateVagasForm = ({ currentWeek, holidays, onSubmit, onCancel, initialVagas, defaultDelegaciaId }) => {

    const getInitialState = () => {
        if (initialVagas) return initialVagas; // <-- usa valores existentes
        const initialState = {};
        const vagasRules = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 6, 0: 5, 6: 5 };

        currentWeek.weekDays.forEach((day, index) => {
            const dayOfWeek = day.getDay();
            const isHoliday = holidays.includes(day.toDateString());
            
            let dayVagas = 0;
            let nightVagas = 0;

            if (isHoliday || [0, 6].includes(dayOfWeek)) {
                dayVagas = 2;
                nightVagas = (vagasRules[dayOfWeek] || 5) * 2;
            } else {
                dayVagas = 0;
                nightVagas = (vagasRules[dayOfWeek] || 3) * 2;
            }

            initialState[index] = { day: dayVagas, night: nightVagas };
        });
        return initialState;
    };

    const [vagasConfig, setVagasConfig] = useState(getInitialState);
    const [isLoading, setIsLoading] = useState(false);
    const [delegacias, setDelegacias] = useState([]);
    const [selectedDelegacia, setSelectedDelegacia] = useState(defaultDelegaciaId ? String(defaultDelegaciaId) : '');
    const [loadingDelegacias, setLoadingDelegacias] = useState(true);
    const [delegaciaError, setDelegaciaError] = useState(null);

    // Sync selectedDelegacia when defaultDelegaciaId arrives asynchronously
    useEffect(() => {
        if (defaultDelegaciaId && !selectedDelegacia) {
            setSelectedDelegacia(String(defaultDelegaciaId));
        }
    }, [defaultDelegaciaId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const loadDelegacias = async () => {
            try {
                const res = await apiClient.getDelegacias();
                const data = Array.isArray(res) ? res : res?.results || [];
                setDelegacias(data);
            } catch (err) {
                console.error('Erro ao carregar delegacias:', err);
                setDelegaciaError('Não foi possível carregar as delegacias. Tente novamente.');
            } finally {
                setLoadingDelegacias(false);
            }
        };
        loadDelegacias();
    }, []);

    const handleChange = (dayIndex, shiftType, value) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return; // Impede valores negativos ou não-numéricos

        setVagasConfig(prev => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                [shiftType]: numValue
            }
        }));
    };

   const handleSubmit = async (e) => {
  e.preventDefault();
  if (!selectedDelegacia) return;
  setIsLoading(true);

  // Se já existirem vagas salvas, faz merge delas com as novas
  const mergedVagas = initialVagas 
    ? { ...initialVagas, ...vagasConfig }
    : vagasConfig;

  await onSubmit(mergedVagas, parseInt(selectedDelegacia, 10));
  setIsLoading(false);
};


    return (
        <form onSubmit={handleSubmit} className="text-gray-800">
            <h2 className="text-2xl font-bold mb-6">Gerar Vagas para a Semana</h2>
            <p className="mb-6 text-gray-600">
                Defina a quantidade de vagas para cada turno nos dias de 
                <span className="font-semibold"> {currentWeek.weekDays[0].toLocaleDateString('pt-BR')}</span> a 
                <span className="font-semibold"> {currentWeek.weekDays[6].toLocaleDateString('pt-BR')}</span>.
            </p>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delegacia <span className="text-red-500">*</span></label>
                {loadingDelegacias ? (
                    <LoadingSpinner />
                ) : delegaciaError ? (
                    <p className="text-red-600 text-sm">{delegaciaError}</p>
                ) : (
                    <select
                        value={selectedDelegacia}
                        onChange={(e) => setSelectedDelegacia(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Selecione uma delegacia...</option>
                        {delegacias.map((d) => (
                            <option key={d.id} value={d.id}>{d.nome}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                {currentWeek.weekDays.map((day, index) => (
                    <div key={index} className="bg-white p-4 border border-gray-300 rounded-lg">
                        <h3 className="font-bold text-lg text-blue-700 capitalize">
                            {day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vagas Diurnas (08h-20h)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={vagasConfig[index].day}
                                    onChange={(e) => handleChange(index, 'day', e.target.value)}
                                    className="w-full p-2 border rounded-md mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vagas Noturnas (19h-01h)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={vagasConfig[index].night}
                                    onChange={(e) => handleChange(index, 'night', e.target.value)}
                                    className="w-full p-2 border rounded-md mt-1"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                <button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">
                    Cancelar
                </button>
                <button type="submit" disabled={isLoading || !selectedDelegacia || !!delegaciaError} className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center disabled:bg-gray-400">
                    {isLoading ? <LoadingSpinner /> : 'Gerar Vagas'}
                </button>
            </div>
        </form>
    );
};