import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TrackingSession } from '../types';
import { Clock, Calendar, MapPin, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';



const TrackingHistory = () => {
    const { user } = useAuth();
    const { getTrackingHistory } = useData();
    const [sessions, setSessions] = useState<TrackingSession[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            const data = await getTrackingHistory();
            setSessions(data || []);
        };
        loadHistory();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} />;
            case 'rejected': return <XCircle size={16} />;
            default: return <ClockIcon size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprovado';
            case 'rejected': return 'Rejeitado';
            default: return 'Pendente';
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="text-blue-600" size={28} />
                    Meu Histórico de Campo
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Visualize seus relatórios de ministério anteriores.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum registro encontrado.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {sessions.map(session => (
                            <div key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                        {format(new Date(session.startTime), 'dd')}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {format(new Date(session.startTime), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {Math.floor(session.durationSeconds / 3600)}h {Math.floor((session.durationSeconds % 3600) / 60)}min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                {(session.distanceMeters / 1000).toFixed(2)} km
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${getStatusColor(session.status)}`}>
                                    {getStatusIcon(session.status)}
                                    {getStatusLabel(session.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingHistory;
