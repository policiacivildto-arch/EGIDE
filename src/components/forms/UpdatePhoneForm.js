import React, { useState } from 'react';
import { formatTelefone } from '../../utils/helpers';

export default function UpdatePhoneForm({ currentUser, onClose, showNotification }) {
  const [phone, setPhone] = useState(currentUser?.telefone || '');
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Placeholder: the real implementation should update Firestore
    showNotification('Atualização de telefone simulada (implemente a lógica real).', 'info');
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
      <div>
        <label className="block font-semibold">Telefone</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(formatTelefone(e.target.value))} className="w-full p-2 border rounded mt-1" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-400 rounded">Cancelar</button>
        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded">Salvar</button>
      </div>
    </form>
  );
}
