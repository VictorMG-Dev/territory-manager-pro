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
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, colorScheme }: any) => {
  const colorStyles = {
    blue: "bg-blue-500 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500 text-rose-600 dark:text-rose-400",
  };

  const selectedColor = colorStyles[colorScheme as keyof typeof colorStyles] || colorStyles.blue;
  // Separate bg and text? The original used color for bg (e.g. bg-blue-500) and then derived text.
  // Actually, the original passed `color="bg-blue-500"`.
  // Let's simplify.

  // New approach: Pass simple color name 'blue', 'emerald', etc.

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-gray-400 to-transparent rounded-bl-3xl transition-opacity group-hover:opacity-10`} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${selectedColor.split(' ')[0].replace('500', '500/10')} ${selectedColor.split(' ').slice(1).join(' ')}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${selectedColor.split(' ').slice(1).join(' ')}`}>{value}</p>
      </div>
    </div>
  );
};


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

  const [generating, setGenerating] = React.useState(false);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Resumo Geral TerritoryPro", 105, 20, { align: "center" });

      // Stats Section
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 40);
      doc.text(`Total de Territórios: ${stats.total}`, 20, 50);

      const headers = [["Status", "Quantidade", "Porcentagem"]];
      const data = [
        ["Em dia (Verde)", stats.green, `${stats.total > 0 ? Math.round((stats.green / stats.total) * 100) : 0}%`],
        ["Atenção (Amarelo)", stats.yellow, `${stats.total > 0 ? Math.round((stats.yellow / stats.total) * 100) : 0}%`],
        ["Atrasados (Vermelho)", stats.red, `${stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0}%`],
      ];

      autoTable(doc, {
        startY: 60,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Recent Activity
      doc.text("Últimas Atividades", 20, (doc as any).lastAutoTable.finalY + 15);

      const historyHeaders = [["Data", "Território", "Publicador"]];
      const historyData = recentActivity.map(h => [
        format(h.parsedDate, "dd/MM/yyyy"),
        `${h.territoryCode} - ${h.territory}`,
        h.user
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: historyHeaders,
        body: historyData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
      });

      doc.save(`Resumo_Dashboard_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400">Bem-vindo ao TerritoryPro. Veja o panorama geral.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-70"
        >
          {generating ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
          {generating ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Territórios" value={stats.total} icon={Layers} variant="blue" />
        <StatsCard title="Em dia (Verde)" value={stats.green} icon={Users} variant="green" />
        <StatsCard title="Atenção (Amarelo)" value={stats.yellow} icon={Calendar} variant="yellow" />
        <StatsCard title="Atrasado (Vermelho)" value={stats.red} icon={AlertTriangle} variant="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Distribuição por Status
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700 opacity-50" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc', fillOpacity: 0.1 }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: 'var(--tw-bg-opacity, #fff)',
                    color: 'var(--tw-text-opacity, #000)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
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

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Atividade Recente
          </h3>
          <div className="flex-1 space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="w-2 rounded-full bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-500 transition-colors" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{activity.territoryCode} - {activity.territory}: {activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {activity.user} • {formatDistanceToNow(activity.parsedDate, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 self-center" />
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
