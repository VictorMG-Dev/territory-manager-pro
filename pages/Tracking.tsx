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
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Navigation className="text-blue-600" size={28} />
                        Ministério em Campo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm hidden md:block">
                        {isTracking ? "Rastreamento ativo..." : "Pronto para iniciar."}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-3 border-r border-gray-100 dark:border-slate-800">
                        <Clock size={16} className="text-blue-500" />
                        <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                            {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <Ruler size={16} className="text-emerald-500" />
                        <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                            {distance.toFixed(2)} km
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative bg-gray-100 dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-inner z-0">
                {currentPosition ? (
                    <MapContainer
                        center={currentPosition}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <RecenterAutomatically position={isTracking ? currentPosition : null} />

                        <Marker position={currentPosition}>
                            <Popup>Sua localização atual</Popup>
                        </Marker>

                        {path.length > 1 && (
                            <Polyline
                                positions={path}
                                color="#2563eb"
                                weight={5}
                                opacity={0.7}
                            />
                        )}
                    </MapContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-gray-400">
                        <div className="animate-spin text-blue-500">
                            <Navigation size={48} />
                        </div>
                        <p>Obtendo GPS...</p>
                    </div>
                )}

                {/* Floating Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[1000]">
                    {!isTracking ? (
                        <button
                            onClick={startTracking}
                            className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-110 transition-transform"
                        >
                            <Play size={32} fill="currentColor" className="ml-1" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={stopTracking}
                                className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-110 transition-transform"
                            >
                                <Pause size={32} fill="currentColor" />
                            </button>
                            <button
                                onClick={finishTracking}
                                className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-110 transition-transform"
                            >
                                <Save size={32} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tracking;
