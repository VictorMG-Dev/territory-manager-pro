import React from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricalInsights: React.FC = () => {
    const { getHistoricalPatterns, user } = useData();
    const patterns = getHistoricalPatterns();

    if (patterns.monthlyTrends.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                <TrendingUp className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Sem dados históricos suficientes
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Comece a registrar seus relatórios mensais para ver análises de tendências.
                </p>
            </div>
        );
    }

    const goal = user?.serviceRole === 'regular_pioneer' ? 50 :
        user?.serviceRole === 'auxiliary_pioneer' ? 30 : 0;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-indigo-500" />
                Análise de Histórico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Completion Rate Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-100 font-medium mb-1">Taxa de Cumprimento</p>
                        <h4 className="text-4xl font-bold mb-2">{patterns.completionRate}%</h4>
                        <p className="text-sm opacity-90">
                            Das metas mensais atingidas nos últimos 6 meses
                        </p>
                    </div>
                    <Award className="absolute right-4 bottom-4 text-white/20" size={64} />

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                </div>

                {/* Average Hours Card (Mock/Calculated) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Média Mensal</p>
                    <h4 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {(patterns.monthlyTrends.reduce((acc, curr) => acc + curr.hours, 0) / patterns.monthlyTrends.length).toFixed(1)}h
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Média de horas realizadas nos últimos meses
                    </p>
                </div>
            </div>

            {/* Monthly Trends Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Tendência dos Últimos Meses
                </h4>

                <div className="h-64 w-full" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={patterns.monthlyTrends}>
                            <XAxis
                                dataKey="month"
                                tickFormatter={(value) => {
                                    try {
                                        // Handle yyyy-MM
                                        const [year, month] = value.split('-');
                                        const date = new Date(parseInt(year), parseInt(month) - 1);
                                        return format(date, 'MMM', { locale: ptBR }).toUpperCase();
                                    } catch (e) {
                                        return value;
                                    }
                                }}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs">
                                                <p className="font-bold mb-1">{label}</p>
                                                <p>{Number(payload[0].value).toFixed(1)} horas</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="hours"
                                radius={[6, 6, 6, 6]}
                                barSize={40}
                            >
                                {patterns.monthlyTrends.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.hours >= goal ? '#10b981' : '#6366f1'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-500">Meta Atingida</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-xs text-gray-500">Abaixo da Meta</span>
                    </div>
                </div>
            </div>

            {/* Suggestion based on history */}
            {patterns.completionRate < 50 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <TrendingUp className="text-amber-600 dark:text-amber-400 mt-1" size={20} />
                    <div>
                        <p className="font-bold text-amber-900 dark:text-amber-300">Dica de Planejamento</p>
                        <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                            Notamos que você tem dificuldade em atingir a meta. Tente usar o template <strong>"Intensivo Inicial"</strong> para garantir mais horas no começo do mês.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalInsights;
