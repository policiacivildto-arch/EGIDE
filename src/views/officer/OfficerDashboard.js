import React, { useState } from 'react';
import { Calendar, Shield, History } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import VagasCalendarView from './components/VagasCalendarView';
import MinhasOperacoesView from './components/MinhasOperacoesView';
import HistoricoView from './components/HistoricoView';
        

// Adicionamos a nova view 'operacoes'
const views = {
    calendario: { label: 'Calendário de Vagas', icon: Calendar },
    operacoes: { label: 'Minhas Operações', icon: Shield }, // <-- NOVA VIEW
    historico: { label: 'Meu Histórico', icon: History },
};

export default function OfficerDashboard({ user, showNotification }) {
    const [officerView, setOfficerView] = useState('calendario');
    const [searchParams, setSearchParams] = useSearchParams();

    const setOfficerViewAndSyncUrl = (nextView) => {
        if (nextView === officerView) return;
        setOfficerView(nextView);
        const nextParams = new URLSearchParams(searchParams);
        if (nextView === 'calendario') {
            nextParams.delete('view');
        } else {
            nextParams.set('view', nextView);
        }
        setSearchParams(nextParams, { replace: true });
    };

    React.useEffect(() => {
        const viewFromUrl = searchParams.get('view');
        const targetView = viewFromUrl && views[viewFromUrl] ? viewFromUrl : 'calendario';

        if (targetView !== officerView) {
            setOfficerView(targetView);
        }
    }, [searchParams, officerView]);

    const renderContent = () => {
        switch (officerView) {
            case 'historico':
                return <HistoricoView user={user} showNotification={showNotification} />;
            // Adicionamos o case para a nova view
            case 'operacoes':
                return <MinhasOperacoesView user={user} showNotification={showNotification} />; // <-- NOVO COMPONENTE
            case 'calendario':
            default:
                return <VagasCalendarView user={user} showNotification={showNotification} />;
        }
    };

    return (
        <div>
            {/* O menu de navegação agora terá 3 botões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {Object.entries(views).map(([key, { label, icon: Icon }]) => (
                    <button
                        key={key}
                        onClick={() => setOfficerViewAndSyncUrl(key)}
                        className={`p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 transform hover:-translate-y-1 ${
                            officerView === key ? 'bg-blue-600 text-white' : 'bg-gray-900/50 hover:bg-gray-700'
                        }`}
                    >
                        <Icon size={32} className="mb-2" />
                        <span className="text-lg font-bold">{label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl">
                {renderContent()}
            </div>
        </div>
    );
}


