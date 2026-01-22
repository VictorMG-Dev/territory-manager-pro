import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

import { Territory, TerritoryStatus, DailyAllocation } from '../types';
import { getStatusColor, getStatusText, calculateStatus } from '../utils/helpers';

import {
    Calendar,
    Brain,
    Plus,
    Trash2,
    CheckCircle,
    Clock,
    MapPin,
    AlertCircle,
    Save,
    ChevronRight,
    Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK: { id: keyof DailyAllocation; label: string }[] = [
    { id: 'segunda', label: 'Segunda-feira' },
    { id: 'terca', label: 'Terça-feira' },
    { id: 'quarta', label: 'Quarta-feira' },
    { id: 'quinta', label: 'Quinta-feira' },
    { id: 'sexta', label: 'Sexta-feira' },
    { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' },
];

const WeeklyPlanning: React.FC = () => {
    const { territories, weeklyPlans, saveWeeklyPlan, groups } = useData();
    const { user } = useAuth();


    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');

    const currentGroupPlanning = useMemo(() =>
        weeklyPlans.find(p => p.groupId === selectedGroupId),
        [weeklyPlans, selectedGroupId]
    );

    const [daysState, setDaysState] = useState<DailyAllocation>({
        segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: []
    });

    const [selectedDay, setSelectedDay] = useState<keyof DailyAllocation>('segunda');

    // Effect to ensure a valid selection
    React.useEffect(() => {
        const isMyTerritories = selectedGroupId === 'my_territories';
        const isGroup = groups.some(g => g.id === selectedGroupId);

        if (isMyTerritories || isGroup) return;

        if (groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        } else if (territories.some(t => t.userId === user?.uid)) {
            setSelectedGroupId('my_territories');
        }
    }, [groups, territories, user, selectedGroupId]);

    // Update daysState when group selection changes or planning updates
    React.useEffect(() => {
        if (currentGroupPlanning) {
            setDaysState(currentGroupPlanning.days);
        } else {
            setDaysState({
                segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: []
            });
        }
    }, [selectedGroupId, currentGroupPlanning]);

    const groupTerritories = useMemo(() => {
        if (selectedGroupId === 'my_territories') {
            return territories.filter(t => t.userId === user?.uid);
        }
        const group = groups.find(g => g.id === selectedGroupId);
        if (!group) return [];
        return territories.filter(t => group.territoryIds.includes(t.id));
    }, [territories, groups, selectedGroupId, user]);

    const suggestedTerritories = useMemo(() => {
        return [...groupTerritories].sort((a, b) => {
            const daysA = calculateStatus(a.lastWorkedDate ? new Date(a.lastWorkedDate) : null).days;
            const daysB = calculateStatus(b.lastWorkedDate ? new Date(b.lastWorkedDate) : null).days;
            return daysB - daysA;
        });
    }, [groupTerritories]);

    const toggleTerritoryForDay = (id: string, day: keyof DailyAllocation) => {
        setDaysState(prev => {
            const currentDayList = prev[day];
            if (currentDayList.includes(id)) {
                return { ...prev, [day]: currentDayList.filter(i => i !== id) };
            } else {
                const newState = { ...prev };
                Object.keys(newState).forEach(d => {
                    const dayKey = d as keyof DailyAllocation;
                    newState[dayKey] = newState[dayKey].filter(i => i !== id);
                });
                newState[day] = [...newState[day], id];
                return newState;
            }
        });
    };

    const handleSavePlan = () => {
        if (!selectedGroupId) {
            toast.error('Crie um grupo primeiro para poder planejar');
            return;
        }
        const hasAnySelection = (Object.values(daysState) as string[][]).some(list => list.length > 0);
        if (!hasAnySelection) {
            toast.error('Selecione pelo menos um território para o planejamento');
            return;
        }
        saveWeeklyPlan(selectedGroupId, daysState);
        toast.success('Planejamento semanal salvo com sucesso!');
    };

    const handleApplyAISuggestion = () => {
        if (groupTerritories.length === 0) {
            toast.error('Este grupo não possui territórios vinculados.');
            return;
        }

        // 1. Sort all territories by age (daysSinceWork descending)
        const sortedByAge = [...groupTerritories].sort((a, b) => {
            const daysA = calculateStatus(a.lastWorkedDate ? new Date(a.lastWorkedDate) : null).days;
            const daysB = calculateStatus(b.lastWorkedDate ? new Date(b.lastWorkedDate) : null).days;
            return daysB - daysA;
        });

        // 2. Identify Large territories for weekends
        const largeTerritories = sortedByAge.filter(t => t.size === 'large');
        const otherTerritories = sortedByAge.filter(t => t.size !== 'large');

        const newDays: DailyAllocation = {
            segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: []
        };

        const usedIds = new Set<string>();

        // 3. Assign to Saturday and Sunday first (prefer Large)
        ['sabado', 'domingo'].forEach(day => {
            const dayKey = day as keyof DailyAllocation;
            // Try to find a large territory that hasn't been used yet
            const suggestedLarge = largeTerritories.find(t => !usedIds.has(t.id));
            if (suggestedLarge) {
                newDays[dayKey].push(suggestedLarge.id);
                usedIds.add(suggestedLarge.id);
            } else {
                // Fallback to oldest available if no large left
                const oldest = sortedByAge.find(t => !usedIds.has(t.id));
                if (oldest) {
                    newDays[dayKey].push(oldest.id);
                    usedIds.add(oldest.id);
                }
            }
        });

        // 4. Fill the rest of the week with remaining oldest territories
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach(day => {
            const dayKey = day as keyof DailyAllocation;
            const oldest = sortedByAge.find(t => !usedIds.has(t.id));
            if (oldest) {
                newDays[dayKey].push(oldest.id);
                usedIds.add(oldest.id);
            }
        });

        setDaysState(newDays);
        toast.success('Sugestão da IA aplicada! (Priorizando territórios antigos e grandes nos fins de semana)');
    };

    const getDayForTerritory = (id: string) => {
        return Object.keys(daysState).find(day => (daysState[day as keyof DailyAllocation] as string[]).includes(id));
    };

    if (groups.length === 0 && territories.filter(t => t.userId === user?.uid).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                <Users className="text-gray-300 dark:text-slate-700 mb-4" size={64} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nenhum território disponível</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">Você não tem grupos criados e nem territórios designados a você.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="text-blue-600 dark:text-blue-400" size={28} />
                        Planejamento Individual
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Organizando para o grupo:</span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="bg-transparent font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer border-b border-blue-600/30"
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                                    {g.name}
                                </option>
                            ))}
                            <option value="my_territories" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-bold text-purple-600">
                                Meus Territórios
                            </option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleApplyAISuggestion}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all font-medium border border-purple-200 dark:border-purple-800"
                    >
                        <Brain size={20} />
                        Sugestão da IA
                    </button>
                    <button
                        onClick={handleSavePlan}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Save size={20} />
                        Salvar Plano
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 transition-colors">
                        <h2 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Selecione o Dia</h2>
                        <div className="grid grid-cols-1 gap-1">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDay(day.id)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedDay === day.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="font-medium">{day.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedDay === day.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                                            }`}>
                                            {daysState[day.id].length}
                                        </span>
                                        <ChevronRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                            <Clock size={20} className="text-gray-400 dark:text-slate-500" />
                            Sugestões para {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.label}
                        </h2>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                            <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                                {suggestedTerritories.map((t) => {
                                    const dayAllocated = getDayForTerritory(t.id);
                                    const isCurrentDay = dayAllocated === selectedDay;

                                    return (
                                        <div
                                            key={t.id}
                                            className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isCurrentDay ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-10 rounded-full ${getStatusColor(t.status)}`} />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t.code} - {t.name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        {calculateStatus(t.lastWorkedDate ? new Date(t.lastWorkedDate) : null).days} dias sem trabalho
                                                        {dayAllocated && !isCurrentDay && (
                                                            <span className="text-blue-500 dark:text-blue-400 ml-2 font-medium">→ {DAYS_OF_WEEK.find(d => d.id === dayAllocated)?.label}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleTerritoryForDay(t.id, selectedDay)}
                                                className={`p-2 rounded-lg transition-all ${isCurrentDay
                                                    ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40'
                                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    }`}
                                            >
                                                {isCurrentDay ? <CheckCircle size={24} /> : <Plus size={24} />}
                                            </button>
                                        </div>
                                    );
                                })}
                                {suggestedTerritories.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        Nenhum território vinculado a este grupo.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <Calendar className="text-emerald-500 dark:text-emerald-400" size={24} />
                            Resumo da Semana ({selectedGroupId === 'my_territories' ? 'Meus Territórios' : groups.find(g => g.id === selectedGroupId)?.name})
                        </h2>

                        <div className="space-y-4">
                            {DAYS_OF_WEEK.map(day => {
                                const dayTerritories = territories.filter(t => daysState[day.id].includes(t.id));

                                return (
                                    <div key={day.id} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`font-bold ${dayTerritories.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                                {day.label}
                                            </h3>
                                            <span className="text-xs text-gray-400">{dayTerritories.length} territórios</span>
                                        </div>

                                        {dayTerritories.length === 0 ? (
                                            <div className="py-3 px-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-xs text-gray-400 text-center italic">
                                                Nenhum território planejado
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dayTerritories.map(t => (
                                                    <div key={t.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t.code}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleTerritoryForDay(t.id, day.id)}
                                                            className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlanning;
