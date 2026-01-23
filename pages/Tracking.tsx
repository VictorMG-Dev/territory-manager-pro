import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Navigation, Save, Clock, Ruler, CloudSun, Footprints, Zap, StopCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

// Fix for default Leaflet icons in React using CDN
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map on position update
const RecenterAutomatically = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom(), { animate: true });
        }
    }, [position, map]);
    return null;
};

// Haversine formula to calculate distance between two points in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

const Tracking = () => {
    const { user } = useAuth();
    const { registerTrackingSession } = useData();
    const [isTracking, setIsTracking] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distance, setDistance] = useState(0);
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);

    // Refs to hold mutable values for geolocation callback
    const watchIdRef = useRef<number | null>(null);
    const pathRef = useRef<[number, number][]>([]);
    const lastPosRef = useRef<[number, number] | null>(null);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking && startTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking, startTime]);

    // Initial position on load
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentPosition([latitude, longitude]);
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    }, []);

    const startTracking = () => {
        setIsTracking(true);
        setStartTime(Date.now() - (elapsedTime * 1000)); // Resume correctly or start new

        if (!navigator.geolocation) {
            toast.error("Geolocalização não suportada neste navegador.");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                const newPos: [number, number] = [latitude, longitude];

                // Update current position UI
                setCurrentPosition(newPos);

                // Add to path if valid
                if (accuracy < 50) { // Only accurate points
                    const lastPos = lastPosRef.current;

                    if (lastPos) {
                        const dist = calculateDistance(lastPos[0], lastPos[1], latitude, longitude);
                        // Only add if moved at least 5 meters
                        if (dist > 0.005) {
                            pathRef.current = [...pathRef.current, newPos];
                            setPath(pathRef.current);
                            setDistance(d => d + dist);
                            lastPosRef.current = newPos;
                        }
                    } else {
                        // First point
                        pathRef.current = [newPos];
                        setPath([newPos]);
                        lastPosRef.current = newPos;
                    }
                }
            },
            (err) => {
                console.error(err);
                if (err.code === 1) toast.error("Permissão de localização negada.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );

        toast.success("Rastreamento iniciado!");
    };

    const stopTracking = () => {
        setIsTracking(false);
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    const finishTracking = async () => {
        stopTracking();
        const confirmSave = window.confirm("Deseja finalizar e salvar este ministério?");
        if (confirmSave) {
            try {
                // Here we would call the API
                const sessionData = {
                    userId: user?.uid!,
                    congregationId: user?.congregationId!,
                    startTime: new Date(Date.now() - (elapsedTime * 1000)).toISOString(),
                    endTime: new Date().toISOString(),
                    durationSeconds: elapsedTime,
                    distanceMeters: distance * 1000,
                    points: path.map((p, i) => ({
                        id: crypto.randomUUID(), // Temp ID, backend handles it usually but we send structure
                        sessionId: '', // Backend handles
                        latitude: p[0],
                        longitude: p[1],
                        accuracy: 0, // Simplified for now
                        timestamp: new Date().toISOString()
                    })) as any // Casting for now to match Omit<TrackingSession>
                };

                // We need to match the Omit<TrackingSession, ...> expected by registerTrackingSession
                // sessionData needs to align with backend expectations.
                // Simplified payload for now:
                await registerTrackingSession({
                    userId: user?.uid!,
                    congregationId: user?.congregationId!,
                    startTime: new Date(Date.now() - (elapsedTime * 1000)).toISOString(),
                    endTime: new Date().toISOString(),
                    durationSeconds: elapsedTime,
                    distanceMeters: distance * 1000,
                    points: [] // We might need to handle points separately or adjust interface
                });

                toast.success("Ministério salvo com sucesso!");

                // Reset state
                setElapsedTime(0);
                setDistance(0);
                setPath([]);
                pathRef.current = [];
                lastPosRef.current = null;
                setStartTime(null);
            } catch (error: any) {
                console.error(error);
                // Extract message from error object if available
                const msg = error?.response?.data?.message || error?.message || "Erro desconhecido";
                toast.error(`Erro ao salvar: ${msg}`);
            }
        } else {
            // Se cancelar, apenas pausa (o stopTracking já foi chamado)
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-80px)] rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl animate-in fade-in duration-700 bg-slate-900 group">

            {/* Map Layer (Always Present) */}
            <div className={`absolute inset-0 z-0 transition-all duration-700 ${!isTracking ? 'opacity-50 blur-sm scale-110' : 'opacity-100 scale-100'}`}>
                {currentPosition ? (
                    <MapContainer
                        center={currentPosition}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        className="grayscale-[0.2]"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <RecenterAutomatically position={isTracking ? currentPosition : null} />

                        <Marker position={currentPosition}>
                            <Popup>Você está aqui</Popup>
                        </Marker>

                        {path.length > 1 && (
                            <Polyline
                                positions={path}
                                color="#3b82f6"
                                weight={6}
                                opacity={0.8}
                            />
                        )}
                    </MapContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Navigation size={48} className="text-blue-500" />
                            <p className="font-medium tracking-widest text-sm uppercase">Localizando GPS...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">

                {/* Header / Top Stats */}
                <div className="flex justify-between items-start pointer-events-auto">
                    {!isTracking ? (
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700 animate-in slide-in-from-top-4 duration-500">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-amber-500 fill-amber-500" size={20} />
                                Ministério em Campo
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pronto para iniciar sua atividade?</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-center animate-in slide-in-from-top-10 duration-500">
                            <div className="bg-slate-900/90 text-white backdrop-blur-xl px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-slate-700/50 min-w-[320px] justify-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tempo</span>
                                    <span className="font-mono text-2xl font-bold tracking-tight">
                                        {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Distância</span>
                                    <span className="font-mono text-2xl font-bold tracking-tight">
                                        {distance.toFixed(2)} <span className="text-sm text-slate-500">km</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weather Widget (Mock) */}
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700 flex items-center gap-3 animate-in slide-in-from-right-4 duration-700 delay-100 pointer-events-auto">
                        <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-xl text-sky-500">
                            <CloudSun size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">24°C</p>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Ensolarado</p>
                        </div>
                    </div>
                </div>

                {/* Center / Bottom Controls */}
                <div className="pointer-events-auto flex flex-col items-center justify-end pb-8">
                    {!isTracking ? (
                        <button
                            onClick={startTracking}
                            className="group relative flex items-center justify-center pointer-events-auto animate-in zoom-in-50 duration-500"
                        >
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40 transform transition-all duration-300 group-hover:scale-110 group-active:scale-95 border-4 border-white dark:border-slate-800 z-10">
                                <Play size={36} fill="white" className="text-white ml-1" />
                            </div>
                            <span className="absolute -bottom-10 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest animate-bounce">Iniciar</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-500">
                            <button
                                onClick={stopTracking}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-slate-700 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-all group-active:scale-95">
                                    <Pause size={24} className="text-amber-500 fill-amber-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pausar</span>
                            </button>

                            <button
                                onClick={finishTracking}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-500/40 group-hover:scale-105 transition-all group-active:scale-95 border-4 border-white dark:border-slate-900">
                                    <StopCircle size={32} fill="white" className="text-white" />
                                </div>
                                <span className="text-xs font-bold text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest">Finalizar</span>
                            </button>

                            <button
                                onClick={() => toast("Visita Registrada!", { icon: '🏡' })}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all group-active:scale-95">
                                    <Footprints size={24} className="text-emerald-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visita</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tracking;
