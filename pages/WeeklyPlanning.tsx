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
    Users,
    ArrowRight,
    Sparkles,
    Printer,
    Check,
    ChevronDown
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

    const handlePrint = () => {
        window.print();
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                            <Calendar className="text-white" size={24} />
                        </div>
                        Planejamento Estratégico
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Visualizando:</span>
                        <div className="relative group">
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="appearance-none bg-transparent font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer pr-6 py-1 border-b-2 border-transparent hover:border-indigo-600/30 transition-all"
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900">
                                        Grupo: {g.name}
                                    </option>
                                ))}
                                <option value="my_territories" className="bg-white dark:bg-slate-900 text-purple-600 font-bold">
                                    Meus Territórios
                                </option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-600/50 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold border border-gray-200 dark:border-slate-700"
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                        onClick={handleApplyAISuggestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-bold group"
                    >
                        <Sparkles size={18} className="transition-transform group-hover:rotate-12" />
                        IA Sugestão
                    </button>
                    <button
                        onClick={handleSavePlan}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all font-bold active:scale-95"
                    >
                        <Save size={18} />
                        Salvar
                    </button>
                </div>
            </div>

            {/* Weekly Timeline Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                <div className="flex justify-between items-center min-w-[600px] gap-4">
                    {DAYS_OF_WEEK.map((day) => {
                        const count = daysState[day.id].length;
                        const isSelected = selectedDay === day.id;

                        return (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.id)}
                                className={`flex-1 flex flex-col items-center gap-3 p-3 rounded-2xl transition-all relative group ${isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                    {day.label.split('-')[0].substring(0, 3)}
                                </span>
                                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${count > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                        style={{ width: `${Math.min(count * 20, 100)}%` }}
                                    />
                                </div>
                                <span className={`text-xl font-bold ${count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-slate-600'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Suggestions / Available */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Brain className="text-purple-500" size={20} />
                            Disponíveis para {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.label}
                        </h2>
                        <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-2 py-1 rounded-lg">
                            Prioridade Automática
                        </span>
                    </div>

                    <div className="space-y-3 custom-scrollbar max-h-[600px] overflow-y-auto pr-2">
                        {suggestedTerritories.map((t, idx) => {
                            const dayAllocated = getDayForTerritory(t.id);
                            const isCurrentDay = dayAllocated === selectedDay;
                            const daysSince = calculateStatus(t.lastWorkedDate ? new Date(t.lastWorkedDate) : null).days;
                            const isHighPriority = daysSince > 90;

                            return (
                                <div
                                    key={t.id}
                                    className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-300 ${isCurrentDay
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10 z-10'
                                        : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(t.status)}`} />
                                            <span className="font-bold text-gray-900 dark:text-white">{t.code}</span>
                                            {isHighPriority && (
                                                <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 font-bold px-1.5 py-0.5 rounded">
                                                    CRÍTICO
                                                </span>
                                            )}
                                        </div>
                                        {dayAllocated && !isCurrentDay && (
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Calendar size={10} />
                                                {DAYS_OF_WEEK.find(d => d.id === dayAllocated)?.label.split('-')[0]}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-3">{t.name}</h3>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {daysSince} dias parado
                                        </p>
                                        <button
                                            onClick={() => toggleTerritoryForDay(t.id, selectedDay)}
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isCurrentDay
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 rotate-0'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-blue-500 hover:text-white rotate-45 hover:rotate-0'
                                                }`}
                                        >
                                            {isCurrentDay ? <Check size={16} /> : <Plus size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Day Plan */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-900/50 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 min-h-[500px] relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 relative z-10">
                            {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.label}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            {territories.filter(t => daysState[selectedDay].includes(t.id)).map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between animate-in zoom-in-95 duration-200 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg mb-1 inline-block">
                                                {t.code}
                                            </span>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{t.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => toggleTerritoryForDay(t.id, selectedDay)}
                                            className="text-gray-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-slate-700/50">
                                        <MapPin size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.address}</span>
                                    </div>
                                </div>
                            ))}

                            {daysState[selectedDay].length === 0 && (
                                <div className="col-span-full py-20 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <Plus size={24} className="opacity-50" />
                                    </div>
                                    <p className="font-medium">Nenhum território para este dia</p>
                                    <p className="text-sm opacity-60">Selecione na lista ao lado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlanning;
