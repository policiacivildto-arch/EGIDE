import React, { useMemo, useState } from 'react';

const buildOptions = (allUsers) => {
    if (!Array.isArray(allUsers)) return [];
    return allUsers
        .filter(user => user?.nome)
        .map(user => ({ label: user.nome, value: user.nome }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

const EditSupervisorModal = ({ entry, allUsers, onSave, onCancel }) => {
    const options = useMemo(() => buildOptions(allUsers), [allUsers]);
    const [selectedName, setSelectedName] = useState(entry?.officerName || '');

    const handleSubmit = (event) => {
        event.preventDefault();
        const name = selectedName.trim();
        if (!name) {
            return;
        }
        onSave({
            convoyId: entry.convoyId,
            supervisorRole: entry.supervisorRole,
            officerName: name,
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Editar Supervisao</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Supervisor</label>
                    <select
                        value={selectedName}
                        onChange={(event) => setSelectedName(event.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-md"
                    >
                        <option value="">Selecione...</option>
                        {options.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2">Se o supervisor nao estiver na lista, digite o nome no campo abaixo.</p>
                    <input
                        type="text"
                        value={selectedName}
                        onChange={(event) => setSelectedName(event.target.value)}
                        placeholder="Nome completo"
                        className="mt-2 w-full p-2 bg-gray-700 rounded-md"
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Salvar</button>
                </div>
            </form>
        </div>
    );
};

export default EditSupervisorModal;
