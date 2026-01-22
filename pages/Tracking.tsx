import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Tracking = () => {
    const { user } = useAuth();
    const [isTracking, setIsTracking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distance, setDistance] = useState(0);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Navigation className="text-blue-600" size={28} />
                    Iniciar Ministério
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Registre seu trajeto e atividade de campo em tempo real.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-32 h-32 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400 relative">
                    <MapPin size={48} />
                    <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 max-w-sm mx-auto">
                    <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                            {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold mt-1">Duração</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                            {distance.toFixed(2)}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold mt-1">Km Percorridos</div>
                    </div>
                </div>

                {!isTracking ? (
                    <button
                        onClick={() => setIsTracking(true)}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3 mx-auto"
                    >
                        <Play size={24} fill="currentColor" />
                        INICIAR
                    </button>
                ) : (
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setIsTracking(false)}
                            className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-3"
                        >
                            <Pause size={24} fill="currentColor" />
                            PAUSAR
                        </button>
                        <button
                            onClick={() => setIsTracking(false)}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3"
                        >
                            <Square size={24} fill="currentColor" />
                            FINALIZAR
                        </button>
                    </div>
                )}
            </div>

            {/* Placeholder map area */}
            <div className="bg-gray-100 dark:bg-slate-900 rounded-3xl h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700 text-gray-400">
                <div className="text-center">
                    <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Mapa será exibido aqui</p>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
