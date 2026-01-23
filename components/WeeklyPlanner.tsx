import React, { useState, useEffect } from 'react';
import {
    Calendar, Target, TrendingUp, Lightbulb, Save, ChevronLeft,
    ChevronRight, CheckCircle2, AlertCircle, Clock, Edit2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PlannedDay, PlanSuggestion, ServiceRole } from '../types';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, getWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ExportManager from './ExportManager';
import TemplateManager from './TemplateManager';

interface WeeklyPlannerProps {
    currentDate: Date;
    monthlyGoal: number;
    currentHours: number;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ currentDate, monthlyGoal, currentHours }) => {
    const { user } = useAuth();
    const { monthlyPlans, saveMonthlyPlan, saveWeeklySchedule, getPlanSuggestions } = useData();
    const monthKey = format(currentDate, 'yyyy-MM');

    // State
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [weeklyHours, setWeeklyHours] = useState<Record<string, { hours: string; minutes: string; notes: string; isFlexible: boolean }>>({
        monday: { hours: '', minutes: '', notes: '', isFlexible: false },
        tuesday: { hours: '', minutes: '', notes: '', isFlexible: false },
        wednesday: { hours: '', minutes: '', notes: '', isFlexible: false },
        thursday: { hours: '', minutes: '', notes: '', isFlexible: false },
        friday: { hours: '', minutes: '', notes: '', isFlexible: false },
        saturday: { hours: '', minutes: '', notes: '', isFlexible: false },
        sunday: { hours: '', minutes: '', notes: '', isFlexible: false }
    });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const currentPlan = monthlyPlans.find(p => p.month === monthKey);
    const serviceRole: ServiceRole = user?.serviceRole || 'publisher';

    // Calculate totals
    const weekTotal = Object.values(weeklyHours).reduce((sum: number, day) => {
        const h = parseFloat((day as any).hours || '0');
        const m = parseFloat((day as any).minutes || '0');
        return sum + h + (m / 60);
    }, 0);

    const totalPlanned = currentPlan?.totalPlannedHours || 0;
    const totalWithThisWeek = totalPlanned + weekTotal;
    const projectedCompletion = monthlyGoal > 0 ? (totalWithThisWeek / monthlyGoal) * 100 : 0;
    const remaining = Math.max(0, monthlyGoal - totalWithThisWeek - currentHours);

    // Get suggestions
    const suggestions = getPlanSuggestions(monthlyGoal, serviceRole);

    // Status Indicator Logic
    const getStatusIndicator = () => {
        if (projectedCompletion >= 100) {
            return {
                icon: <CheckCircle2 size={20} />,
                text: "No caminho certo! Meta será atingida",
                emoji: "🎉",
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
                borderColor: "border-emerald-500"
            };
        } else if (projectedCompletion >= 80) {
            return {
                icon: <TrendingUp size={20} />,
                text: "Bom progresso! Continue assim",
                emoji: "💪",
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                borderColor: "border-blue-500"
            };
        } else if (projectedCompletion >= 50) {
            return {
                icon: <AlertCircle size={20} />,
                text: "Atenção! Precisa ajustar o planejamento",
                emoji: "⚠️",
                color: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-900/20",
                borderColor: "border-amber-500"
            };
        } else {
            return {
                icon: <AlertCircle size={20} />,
                text: "Abaixo do esperado! Revise seu plano",
                emoji: "🚨",
                color: "text-red-600 dark:text-red-400",
                bgColor: "bg-red-50 dark:bg-red-900/20",
                borderColor: "border-red-500"
            };
        }
    };

    const statusIndicator = getStatusIndicator();

    const handleApplySuggestion = (suggestion: PlanSuggestion) => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        const newWeeklyHours = { ...weeklyHours };

        days.forEach(day => {
            const totalHours = suggestion.distribution[day];
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);

            newWeeklyHours[day] = {
                hours: hours.toString(),
                minutes: minutes.toString(),
                notes: '',
                isFlexible: false
            };
        });

        setWeeklyHours(newWeeklyHours);
        setShowSuggestions(false);
        toast.success(`Sugestão "${suggestion.name}" aplicada!`);
    };

    const handleSavePlan = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            // Create or update monthly plan
            let planId = currentPlan?.id;

            if (!planId) {
                // Create new plan
                const newPlan = {
                    userId: user.uid,
                    month: monthKey,
                    targetHours: monthlyGoal,
                    weeks: [],
                    totalPlannedHours: 0,
                    projectedCompletion: 0
                };
                await saveMonthlyPlan(newPlan);
                // Get the created plan ID (in real scenario, API would return it)
                const createdPlan = monthlyPlans.find(p => p.month === monthKey);
                planId = createdPlan?.id || '';
            }

            // Save weekly schedule
            const days: any = {};
            Object.entries(weeklyHours).forEach(([day, data]) => {
                const dayData = data as { hours: string; minutes: string; notes: string; isFlexible: boolean };
                const h = parseInt(dayData.hours || '0');
                const m = parseInt(dayData.minutes || '0');
                if (h > 0 || m > 0) {
                    days[day] = {
                        hours: h,
                        minutes: m,
                        notes: dayData.notes,
                        isFlexible: dayData.isFlexible
                    };
                }
            });

            await saveWeeklySchedule({
                userId: user.uid,
                planId: planId,
                month: monthKey,
                weekNumber: selectedWeek,
                days,
                totalPlannedHours: weekTotal
            });

            toast.success('Planejamento salvo com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar planejamento');
        } finally {
            setIsSaving(false);
        }
    };

    const dayNames = [
        { key: 'monday', label: 'SEG', full: 'Segunda' },
        { key: 'tuesday', label: 'TER', full: 'Terça' },
        { key: 'wednesday', label: 'QUA', full: 'Quarta' },
        { key: 'thursday', label: 'QUI', full: 'Quinta' },
        { key: 'friday', label: 'SEX', full: 'Sexta' },
        { key: 'saturday', label: 'SÁB', full: 'Sábado' },
        { key: 'sunday', label: 'DOM', full: 'Domingo' }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Progress */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold">Planejamento Mensal</h3>
                        <p className="text-indigo-100 text-sm mt-1">
                            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-90">Meta</p>
                        <p className="text-3xl font-bold">{monthlyGoal}h</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                        <p className="text-xs opacity-80">Realizado</p>
                        <p className="text-xl font-bold">{currentHours.toFixed(1)}h</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                        <p className="text-xs opacity-80">Planejado</p>
                        <p className="text-xl font-bold">{totalWithThisWeek.toFixed(1)}h</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                        <p className="text-xs opacity-80">Faltam</p>
                        <p className="text-xl font-bold">{remaining.toFixed(1)}h</p>
                    </div>
                </div>

                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, projectedCompletion)}%` }}
                    />
                </div>
                <p className="text-sm mt-2 text-center opacity-90">
                    {projectedCompletion >= 100 ? (
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> Meta atingida! 🎉
                        </span>
                    ) : (
                        `${projectedCompletion.toFixed(0)}% da meta`
                    )}
                </p>
            </div>

            {/* Status Indicator */}
            <div className={`${statusIndicator.bgColor} border-2 ${statusIndicator.borderColor} p-4 rounded-2xl`}>
                <div className="flex items-center gap-3">
                    <div className={statusIndicator.color}>
                        {statusIndicator.icon}
                    </div>
                    <div className="flex-1">
                        <p className={`font-bold ${statusIndicator.color}`}>
                            {statusIndicator.text} {statusIndicator.emoji}
                        </p>
                        {remaining > 0 && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Faltam {remaining.toFixed(1)}h para atingir a meta
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Week Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                    disabled={selectedWeek === 1}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-30"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-gray-900 dark:text-white">
                    Semana {selectedWeek}
                </span>
                <button
                    onClick={() => setSelectedWeek(Math.min(5, selectedWeek + 1))}
                    disabled={selectedWeek === 5}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-30"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Weekly Grid */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Distribuição Semanal</h4>
                    <button
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-sm hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors"
                    >
                        <Lightbulb size={18} />
                        Sugestões
                    </button>
                </div>

                {showSuggestions && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-3">
                            Escolha um modelo de distribuição:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.type}
                                    onClick={() => handleApplySuggestion(suggestion)}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-left group"
                                >
                                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                        {suggestion.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {suggestion.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {dayNames.map(({ key, label, full }) => {
                        const dayData = weeklyHours[key as keyof typeof weeklyHours];
                        const dayTotal = parseFloat(dayData.hours || '0') + (parseFloat(dayData.minutes || '0') / 60);
                        const hasPlanning = dayTotal > 0;

                        // Color coding based on planning status
                        const dayColors = hasPlanning
                            ? {
                                bg: 'bg-blue-50 dark:bg-blue-900/20',
                                border: 'border-blue-300 dark:border-blue-700',
                                text: 'text-blue-700 dark:text-blue-400',
                                icon: '📅'
                            }
                            : {
                                bg: 'bg-gray-50 dark:bg-slate-800',
                                border: 'border-gray-200 dark:border-slate-700',
                                text: 'text-gray-500 dark:text-gray-400',
                                icon: ''
                            };

                        return (
                            <div
                                key={key}
                                className={`
                                    flex items-center gap-3 p-4 rounded-xl
                                    ${dayColors.bg}
                                    border-2 ${dayColors.border}
                                    transition-all duration-300
                                    hover:shadow-lg hover:-translate-y-0.5
                                `}
                            >
                                {/* Status Icon */}
                                {dayColors.icon && (
                                    <div className="text-xl">{dayColors.icon}</div>
                                )}

                                {/* Day Label */}
                                <div className="w-16 text-center">
                                    <p className={`text-xs font-bold uppercase ${dayColors.text}`}>{label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{full}</p>
                                </div>

                                {/* Inputs */}
                                <div className="flex gap-2 flex-1">
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={dayData.hours}
                                            onChange={(e) => setWeeklyHours({
                                                ...weeklyHours,
                                                [key]: { ...dayData, hours: e.target.value }
                                            })}
                                            placeholder="0"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-center font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            min="0"
                                            max="24"
                                        />
                                        <p className="text-[10px] text-gray-400 text-center mt-0.5">horas</p>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={dayData.minutes}
                                            onChange={(e) => setWeeklyHours({
                                                ...weeklyHours,
                                                [key]: { ...dayData, minutes: e.target.value }
                                            })}
                                            placeholder="0"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-center font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            min="0"
                                            max="59"
                                        />
                                        <p className="text-[10px] text-gray-400 text-center mt-0.5">min</p>
                                    </div>
                                </div>

                                {/* Total with animation */}
                                <div className="w-24 text-right">
                                    <p className={`text-xl font-bold ${dayColors.text} transition-all duration-300`}>
                                        {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total da Semana</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{weekTotal.toFixed(1)}h</p>
                    </div>
                    <button
                        onClick={handleSavePlan}
                        disabled={isSaving || weekTotal === 0}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={20} />
                        {isSaving ? 'Salvando...' : 'Salvar Planejamento'}
                    </button>
                </div>
            </div>

            {/* Export Manager */}
            <ExportManager
                monthlyPlan={currentPlan}
                currentDate={currentDate}
                currentHours={currentHours}
            />

            {/* Template Manager */}
            <TemplateManager
                currentDistribution={weeklyHours}
                onApplyTemplate={(distribution) => setWeeklyHours(distribution)}
                targetHours={monthlyGoal}
            />
        </div>
    );
};

export default WeeklyPlanner;
