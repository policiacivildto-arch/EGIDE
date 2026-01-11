import React, { useEffect } from 'react';
import { XSquare } from 'lucide-react';

export const LoadingSpinner = () => <div className="flex justify-center items-center h-full w-full"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;


// --- COMPONENTES DA UI ---

// CORREÇÃO: Uso de mapa de classes para evitar problemas com PurgeCSS. 
export const Modal = ({ children, onClose, size = '3xl' }) => {
    const sizeClasses = {
        '3xl': 'max-w-3xl',
        '5xl': 'max-w-5xl',
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className={`bg-gray-100 rounded-2xl shadow-2xl w-full ${sizeClasses[size] || 'max-w-3xl'} max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in-up`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"><XSquare size={28} /></button>
                {children}
            </div>
        </div>
    );
};

export const Notification = ({ message, type, onDismiss }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => onDismiss(), 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;

    const typeClasses = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500", warning: "bg-yellow-500" };
    return (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white z-[100] animate-fade-in-down ${typeClasses[type]}`} onClick={onDismiss}>{message}</div>);
};