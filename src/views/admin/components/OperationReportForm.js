import React, { useState } from 'react';

export default function OperationReportForm({ initialData = {}, onSubmit, onCancel, showNotification }) {
  const [form, setForm] = useState(initialData);
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={handleSubmit} className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-2">Editar Relatório</h2>
      <textarea value={form.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="w-full p-2 border rounded" rows={6} />
      <div className="mt-4 flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-400 rounded">Cancelar</button>
        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded">Salvar</button>
      </div>
    </form>
  );
}
