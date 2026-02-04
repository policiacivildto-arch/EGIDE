import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Configurações e Utilitários
import { auth, db, appId } from './config/firebase';
import { PCCE_LOGO_URL } from './constants/data';


// Componentes UI e Forms
import { LoadingSpinner, Notification, Modal } from './components/ui/Shared';
import Header from './components/layout/Header';
import UpdatePhoneForm from './components/forms/UpdatePhoneForm';
import { AuthLayout } from './components/auth/AuthLayout';

// Telas de Autenticação (Certifique-se de ter criado estes arquivos em views/auth/)
import { LoginScreen } from './views/auth/LoginScreen'; 
import { SignUpScreen } from './views/auth/SignUpScreen';
import { ForgotPasswordScreen } from './views/auth/ForgotPasswordScreen';

// Dashboards Principais
import OfficerDashboard from './views/officer/OfficerDashboard';
import AdminDashboard from './views/admin/AdminDashboard';
import DashboardDepartamento from './views/departamentos/DashboardDepartamento';
import HomePage from './views/HomePage';
import OperationsDashboard from './views/operations/OperationsDashboard';

// Exemplo de CRUD Completo Django
import ExemploCicloCompleto from './examples/ExemploCicloCompleto';

// Re-export commonly-used UI/layout helpers so other modules can import from `../../App`
export { LoadingSpinner, Notification, Modal, AuthLayout, Header };
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSystem, setSelectedSystem] = useState(null); // 'egide' | 'operacoes' | null
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authScreen, setAuthScreen] = useState('login'); 
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [profileModal, setProfileModal] = useState(null);

    useEffect(() => {
        // Listener de Autenticação
        // Note: jsPDF and html2canvas are now imported via npm in components that use them
        let unsubscribeUserDoc;
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if(unsubscribeUserDoc) unsubscribeUserDoc();
                
                const userDocRef = doc(db, `/artifacts/${appId}/users`, firebaseUser.uid);
                unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: firebaseUser.uid, ...docSnap.data() });
                        setUser(firebaseUser);
                    } else {
                        signOut(auth);
                    }
                });
            } else {
                if(unsubscribeUserDoc) unsubscribeUserDoc();
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => { 
            unsubscribeAuth(); 
            if(unsubscribeUserDoc) unsubscribeUserDoc(); 
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setCurrentPage('dashboard');
        setSelectedSystem(null); // Volta para a página de seleção
    };

    const handleSelectSystem = (system) => {
        setSelectedSystem(system);
    };

    const handleBackToHome = () => {
        setSelectedSystem(null);
        setCurrentPage('dashboard');
    };

    const showNotification = (message, type = 'info') => setNotification({ message, type });

    // Renderiza o modal de perfil (ex: trocar telefone)
    const renderProfileModal = () => {
        if (!profileModal) return null;
        
        const closeModal = () => setProfileModal(null);

        switch (profileModal) {
            case 'phone':
                return (
                    <Modal onClose={closeModal}>
                        <UpdatePhoneForm
                            currentUser={userData}
                            showNotification={showNotification}
                            onClose={closeModal}
                        />
                    </Modal>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center"><img src={PCCE_LOGO_URL} alt="Brasão PCCE" className="h-24 w-24 animate-pulse" /><h1 className="text-3xl font-bold mt-4">Sistema EGIDE</h1><p className="text-lg text-gray-400">Carregando...</p><LoadingSpinner /></div>;

    // Lógica de Roteamento de Autenticação
    if (!user) {
        switch (authScreen) {
            case 'signup':
                return <SignUpScreen showNotification={showNotification} setAuthScreen={setAuthScreen} />;
            case 'forgotPassword':
                return <ForgotPasswordScreen showNotification={showNotification} setAuthScreen={setAuthScreen} />;
            default:
                return <LoginScreen showNotification={showNotification} setAuthScreen={setAuthScreen} />;
        }
    }

    // 🎯 ROTA DE TESTE: Acesse /teste-crud para ver o ciclo completo
    // Coloque ?teste=1 na URL para ativar
    if (window.location.search.includes('teste=1')) {
        return <ExemploCicloCompleto />;
    }

    // Página de Seleção de Sistema (antes de entrar no app)
    if (!selectedSystem) {
        return <HomePage onSelectSystem={handleSelectSystem} />;
    }

    // App Logado - Renderiza o sistema selecionado
    return (
        <div className="bg-gray-800 text-white min-h-screen font-sans">
            {renderProfileModal()}
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
            
            <Header 
                user={userData} 
                setCurrentPage={setCurrentPage} 
                currentPage={currentPage} 
                onLogout={handleLogout} 
                onOpenProfileModal={setProfileModal}
                selectedSystem={selectedSystem}
                onBackToHome={handleBackToHome}
            />
            
            <main className="p-4 md:p-8">
                {selectedSystem === 'egide' ? (
                    // Sistema EGIDE
                    userData?.role === 'admin' && currentPage === 'admin'
                        ? <AdminDashboard userData={userData} showNotification={showNotification} />
                        : userData?.role === 'departamento'
                        ? <DashboardDepartamento userData={userData} showNotification={showNotification} />
                        : <OfficerDashboard user={userData} showNotification={showNotification} />
                ) : selectedSystem === 'operacoes' ? (
                    // Sistema OPERAÇÕES
                    <OperationsDashboard userData={userData} showNotification={showNotification} />
                ) : null}
            </main>
        </div>
    );
}

// No additional code needed at the end of the file.
// To run this React app, use the following command in your terminal:
// npm start
// or
// yarn start