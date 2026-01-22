import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TrackingSession } from '../types';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Map, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Extended session for admin view might include user name if backend joins it
// For now assuming TrackingSession has everything or we map it
interface AdminSession extends TrackingSession {
    userName?: string;
}

const TrackingAdmin = () => {
    const { user } = useAuth();
    const { getPendingReports, approveReport, rejectReport } = useData();
    const [sessions, setSessions] = useState<AdminSession[]>([]);

    useEffect(() => {
        const loadPending = async () => {
            try {
                const data = await getPendingReports();
                // Map data if needed, for now assuming backend returns what we need
                // We might need to fetch user names if not included in the view/query
                setSessions(data as AdminSession[] || []);
            } catch (error) {
                console.error("Error loading reports", error);
            }
        };
        loadPending();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await approveReport(id);
            setSessions(sessions.filter(s => s.id !== id));
            toast.success("Relatório aprovado!");
        } catch (e) { toast.error("Erro ao aprovar."); }
    }

    const handleReject = async (id: string) => {
        try {
            await rejectReport(id);
            setSessions(sessions.filter(s => s.id !== id));
            toast.success("Relatório rejeitado.");
        } catch (e) { toast.error("Erro ao rejeitar."); }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" size={28} />
                    Aprovação de Relatórios
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Analise e aprove as atividades de campo dos publicadores.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sessions.map(session => (
                    <div key={session.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{session.userName}</h3>
                                    <p className="text-xs text-gray-500">{format(new Date(session.startTime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                Pendente
                            </span>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Distância</p>
                                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{(session.distanceMeters / 1000).toFixed(2)} km</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Duração</p>
                                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                                    {Math.floor(session.durationSeconds / 3600)}h {Math.floor((session.durationSeconds % 3600) / 60)}min
                                </p>
                            </div>
                            {session.notes && (
                                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Notas</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{session.notes}"</p>
                                </div>
                            )}
                        </div>

                        {/* Wrapper for buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleReject(session.id)}
                                className="flex-1 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} />
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleApprove(session.id)}
                                className="flex-1 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Aprovar
                            </button>
                        </div>

                        <button className="w-full mt-3 py-2 text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center justify-center gap-1 hover:underline">
                            Ver Mapa Detalhado <ChevronRight size={14} />
                        </button>
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">Todos os relatórios foram processados!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingAdmin;
