import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TrackingSession } from '../types';
import { Clock, Calendar, MapPin, CheckCircle, XCircle, Clock as ClockIcon, Trophy, Medal, TrendingUp, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TrackingHistory = () => {
    const { user } = useAuth();
    const { getTrackingHistory, getTrackingSessionDetails } = useData();
    const [sessions, setSessions] = useState<TrackingSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<TrackingSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            const data = await getTrackingHistory();
            setSessions(data || []);
        };
        loadHistory();
    }, []);

    // Calculate Summary Stats
    const totalSeconds = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalDistanceKm = sessions.reduce((acc, curr) => acc + curr.distanceMeters, 0) / 1000;
    const sessionCount = sessions.length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} />;
            case 'rejected': return <XCircle size={16} />;
            default: return <Hourglass size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprovado';
            case 'rejected': return 'Rejeitado';
            default: return 'Em Análise';
        }
    }

    const openDetails = async (sessionId: string) => {
        setLoadingDetails(true);
        try {
            const details = await getTrackingSessionDetails(sessionId);
            setSelectedSession(details);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to load details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetails = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                            <ClockIcon size={24} />
                        </div>
                        Meu Legado
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Visualize sua jornada e conquistas no ministério.
                    </p>
                </div>

                {/* Gamification Badge (Mock) */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                    <div className="bg-amber-500 text-white p-2 rounded-xl shadow-md">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase">Nível Atual</p>
                        <p className="font-bold text-amber-900 dark:text-amber-100">Pioneiro Dedicado</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tempo Total</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{totalHours}</span>
                        <span className="text-lg font-medium text-gray-500">h</span>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white ml-2">{totalMinutes}</span>
                        <span className="text-lg font-medium text-gray-500">min</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MapPin size={64} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Distância</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{totalDistanceKm.toFixed(1)}</span>
                        <span className="text-lg font-medium text-gray-500">km</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-purple-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Sessões</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{sessionCount}</span>
                        <span className="text-lg font-medium text-gray-500">saídas</span>
                    </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Linha do Tempo</h2>

                {sessions.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">Nenhuma atividade registrada ainda.</p>
                        <p className="text-sm text-gray-400 mt-1">Inicie um ministério para começar sua jornada!</p>
                    </div>
                ) : (
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
                        {sessions.map((session, index) => (
                            <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Timeline Dot */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto md:absolute md:left-1/2 transform transition-transform group-hover:scale-110">
                                    <MapPin size={16} />
                                </div>

                                {/* Card Content */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer group-hover:-translate-y-1" onClick={() => openDetails(session.id)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {format(new Date(session.startTime), "EEEE, d MMM", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                Ministério de Campo
                                            </h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full border ${getStatusColor(session.status)}`}>
                                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                                                {getStatusIcon(session.status)}
                                                {getStatusLabel(session.status)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Tempo</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {Math.floor(session.durationSeconds / 3600)}h {Math.floor((session.durationSeconds % 3600) / 60)}m
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                <Medal size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Km</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {(session.distanceMeters / 1000).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Ver Detalhes <TrendingUp size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {
                isModalOpen && selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-blue-600" />
                                    Detalhes da Jornada
                                </h2>
                                <button onClick={closeDetails} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <XCircle size={24} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="relative h-[60vh] w-full bg-gray-100">
                                {selectedSession.points && selectedSession.points.length > 0 ? (
                                    <MapContainer
                                        center={[selectedSession.points[0].latitude, selectedSession.points[0].longitude]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Polyline
                                            positions={selectedSession.points.map(p => [p.latitude, p.longitude])}
                                            color="#3b82f6"
                                            weight={6}
                                            opacity={0.8}
                                        />
                                        <Marker position={[selectedSession.points[0].latitude, selectedSession.points[0].longitude]}>
                                            <Popup>🔴 Início</Popup>
                                        </Marker>
                                        <Marker position={[selectedSession.points[selectedSession.points.length - 1].latitude, selectedSession.points[selectedSession.points.length - 1].longitude]}>
                                            <Popup>🏁 Fim</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-500">
                                        Sem dados de GPS para este relatório.
                                    </div>
                                )}
                            </div>

                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-950/50">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Data</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{format(new Date(selectedSession.startTime), "dd/MM/yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Duração</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {Math.floor(selectedSession.durationSeconds / 3600)}h {Math.floor((selectedSession.durationSeconds % 3600) / 60)}min
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Distância</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{(selectedSession.distanceMeters / 1000).toFixed(2)} km</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${getStatusColor(selectedSession.status)}`}>
                                        {getStatusLabel(selectedSession.status)}
                                    </span>
                                </div>
                                {selectedSession.notes && (
                                    <div className="col-span-full mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Observações</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{selectedSession.notes}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TrackingHistory;
