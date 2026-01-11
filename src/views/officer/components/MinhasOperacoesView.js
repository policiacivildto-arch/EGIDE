import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';
import { Modal, LoadingSpinner } from '../../../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { displayMatricula } from '../../../utils/helpers';

export const MinhasOperacoesView = ({ user, showNotification }) => {
    const [myConvoys, setMyConvoys] = useState([]);
    const [reports, setReports] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    useEffect(() => {
        if (!user || !user.matricula) {
            setLoading(false);
            return;
        }

        const fetchMyData = async () => {
            setLoading(true);

            const teamsQuery = query(collection(db, `/artifacts/${appId}/public/data/teams`), where('memberMatriculas', 'array-contains', user.matricula));
            const teamsSnap = await getDocs(teamsQuery);
            const myTeamIds = teamsSnap.docs.map(doc => doc.id);

            if (myTeamIds.length === 0) {
                setLoading(false);
                return;
            }

            const convoysQuery = query(collection(db, `/artifacts/${appId}/public/data/convoys`), where('teamIds', 'array-contains-any', myTeamIds));
            const convoysSnap = await getDocs(convoysQuery);
            const convoyData = convoysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.date.seconds - a.date.seconds);
            setMyConvoys(convoyData);

            const convoyIds = convoyData.map(c => c.id);
            if (convoyIds.length > 0) {
                const reportsQuery = query(collection(db, `/artifacts/${appId}/public/data/convoyReports`), where('convoyId', 'in', convoyIds));
                const reportsSnap = await getDocs(reportsQuery);
                const reportsMap = new Map();
                reportsSnap.docs.forEach(doc => {
                    const report = { id: doc.id, ...doc.data() };
                    reportsMap.set(report.convoyId, report);
                });
                setReports(reportsMap);
            }
            setLoading(false);
        };

        fetchMyData();
    }, [user]);

    const handleOpenForm = (convoy) => setModalContent({ type: 'fillReport', convoy });
    const handleViewReport = (convoy) => setModalContent({ type: 'viewReport', report: reports.get(convoy.id) });
    const handleCloseModal = () => setModalContent(null);

    const handleSubmitReport = async (reportData) => {
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/convoyReports`), reportData);
            showNotification('Relatório enviado com sucesso!', 'success');
            const newReport = { ...reportData, id: 'temp' };
            setReports(prev => new Map(prev).set(reportData.convoyId, newReport));
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            showNotification('Falha ao enviar o relatório.', 'error');
        }
    };

    const renderModal = () => {
        if (!modalContent) return null;
        const { type, convoy, report } = modalContent;
        if (type === 'fillReport') return <div />; // placeholder for OperationReportForm
        if (type === 'viewReport') return <div />; // placeholder for ViewReport
        return null;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            {renderModal()}
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Minhas Operações</h2>
            {myConvoys.length === 0 ? (
                <p className="text-center text-gray-400">Você não participou de nenhuma operação registrada.</p>
            ) : (
                <div className="space-y-4">
                    {myConvoys.map(convoy => {
                        const hasReport = reports.has(convoy.id);
                        return (
                            <div key={convoy.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-blue-400">{`Comboio ${convoy.numeroComboio || ''} - ${new Date(convoy.date.seconds * 1000).toLocaleDateString('pt-BR')}`}</p>
                                    <p className="text-sm text-gray-400">AIS: {convoy.ais} - Bairros: {Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : 'N/A'}</p>
                                </div>
                                {hasReport ? (
                                    <button onClick={() => handleViewReport(convoy)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-2 rounded-lg">Ver Relatório</button>
                                ) : (
                                    <button onClick={() => handleOpenForm(convoy)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Preencher Relatório</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
export default MinhasOperacoesView;
