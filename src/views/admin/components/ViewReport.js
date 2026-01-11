import React from 'react';

export default function ViewReport({ report, onCancel }) {
  if (!report) return null;
  return (
    <div className="text-gray-800 p-4">
      <h2 className="text-xl font-bold mb-2">Visualizar Relatório</h2>
      <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(report, null, 2)}</pre>
      <div className="mt-4 flex justify-end">
        <button onClick={onCancel} className="py-2 px-4 bg-gray-400 rounded">Fechar</button>
      </div>
    </div>
  );
}
