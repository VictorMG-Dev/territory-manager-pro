import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TrackingSession } from '../types';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Map, User, ChevronRight, MapPin, Filter, Search } from 'lucide-react';
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

// Extended session for admin view might include user name if backend joins it
// For now assuming TrackingSession has everything or we map it
interface AdminSession extends TrackingSession {
    userName?: string;
}

const TrackingAdmin = () => {
    const { user } = useAuth();
    const { getPendingReports, approveReport, rejectReport, getTrackingSessionDetails } = useData();
    const [sessions, setSessions] = useState<AdminSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<TrackingSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const openDetails = async (sessionId: string) => {
        try {
            const details = await getTrackingSessionDetails(sessionId);
            setSelectedSession(details);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to load details", error);
            toast.error("Erro ao carregar mapa.");
        }
    };

    const closeDetails = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
                            <FileText size={24} />
                        </div>
                        Central de Aprovação
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Gerencie e valide as atividades de campo com eficiência.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar publicador..."
                            className="pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 transition-all shadow-sm"
                        />
                    </div>
                    <button className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Pending Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sessions.map(session => (
                    <div key={session.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Status Indicator Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />

                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-inner">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{session.userName || "Publicador"}</h3>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        {format(new Date(session.startTime), "dd MMM, HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-800/50">
                                Pendente
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Distância</p>
                                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{(session.distanceMeters / 1000).toFixed(2)}<span className="text-sm text-gray-500 ml-1">km</span></p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duração</p>
                                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                                    {Math.floor(session.durationSeconds / 3600)}<span className="text-sm text-gray-500 mx-0.5">h</span>
                                    {Math.floor((session.durationSeconds % 3600) / 60)}<span className="text-sm text-gray-500 mx-0.5">m</span>
                                </p>
                            </div>
                        </div>

                        {session.notes && (
                            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                                <p className="text-xs text-yellow-600 dark:text-yellow-500 italic line-clamp-2">"{session.notes}"</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleReject(session.id)}
                                className="flex-1 h-10 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleApprove(session.id)}
                                className="flex-[2] h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} /> Aprovar
                            </button>
                        </div>

                        <button
                            onClick={() => openDetails(session.id)}
                            className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors"
                        >
                            Ver Mapa Detalhado <ChevronRight size={12} />
                        </button>
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                            <CheckCircle className="text-emerald-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tudo em dia!</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto mt-1">Todos os relatórios foram processados. Bom trabalho, administrador.</p>
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {isModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="text-indigo-600" />
                                Detalhes da Sessão
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
                                        color="#4f46e5"
                                        weight={6}
                                        opacity={0.8}
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
                        <div className="p-4 bg-gray-50 dark:bg-slate-950/50 flex justify-end">
                            <button onClick={closeDetails} className="text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                Fechar Visualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackingAdmin;
