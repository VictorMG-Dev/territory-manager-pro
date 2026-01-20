import React, { useMemo } from 'react';
import {
  Users,
  Layers,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TerritoryStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatsCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {/* Trend removed as it requires historical comparison logic which is effectively 0 for a new app */}
    </div>
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const Dashboard = () => {
  const { territories, getHistory } = useData();

  const stats = useMemo(() => {
    const total = territories.length;
    const green = territories.filter(t => t.status === TerritoryStatus.GREEN).length;
    const yellow = territories.filter(t => t.status === TerritoryStatus.YELLOW).length;
    const red = territories.filter(t => t.status === TerritoryStatus.RED).length;

    return { total, green, yellow, red };
  }, [territories]);

  const statsData = [
    { name: 'Em dia', value: stats.green, color: '#10B981' },
    { name: 'Atenção', value: stats.yellow, color: '#F59E0B' },
    { name: 'Atrasado', value: stats.red, color: '#EF4444' },
  ];

  const recentActivity = useMemo(() => {
    const allActivity = territories.flatMap(t => {
      const history = getHistory(t.id);
      return history.map(h => ({
        id: h.id,
        territory: t.name,
        territoryCode: t.code,
        user: h.publisherName,
        date: h.date, // string or Date? Context types says string usually but let's check
        // If date is saved as string in JSON, we parse it
        parsedDate: new Date(h.date),
        action: 'Trabalho realizado'
      }));
    });

    // Sort by date desc
    return allActivity.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()).slice(0, 5);
  }, [territories, getHistory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bem-vindo ao TerritoryPro. Veja o panorama geral.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <TrendingUp size={18} />
          Gerar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Territórios" value={stats.total} icon={Layers} color="bg-blue-500" />
        <StatsCard title="Em dia (Verde)" value={stats.green} icon={Users} color="bg-emerald-500" />
        <StatsCard title="Atenção (Amarelo)" value={stats.yellow} icon={Calendar} color="bg-amber-500" />
        <StatsCard title="Atrasado (Vermelho)" value={stats.red} icon={AlertTriangle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Distribuição por Status
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Atividade Recente
          </h3>
          <div className="flex-1 space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="w-2 rounded-full bg-blue-100 group-hover:bg-blue-500 transition-colors" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{activity.territoryCode} - {activity.territory}: {activity.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.user} • {formatDistanceToNow(activity.parsedDate, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 self-center" />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma atividade recente.</p>
            )}
          </div>
          <Link to="/territories" className="mt-8 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Ver todos os territórios
          </Link>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
