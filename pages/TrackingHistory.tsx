import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TrackingSession } from '../types';
import { Clock, Calendar, MapPin, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';
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
                                <button
                                    onClick={() => openDetails(session.id)}
                                    className="mt-3 md:mt-0 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {
                isModalOpen && selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-blue-600" />
                                    Detalhes do Ministério
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
                                            color="blue"
                                            weight={4}
                                            opacity={0.7}
                                        />
                                        <Marker position={[selectedSession.points[0].latitude, selectedSession.points[0].longitude]}>
                                            <Popup>Início</Popup>
                                        </Marker>
                                        <Marker position={[selectedSession.points[selectedSession.points.length - 1].latitude, selectedSession.points[selectedSession.points.length - 1].longitude]}>
                                            <Popup>Fim</Popup>
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
                                    <span className={`text-xs font-bold uppercase ${getStatusColor(selectedSession.status).split(' ')[1]}`}>
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
