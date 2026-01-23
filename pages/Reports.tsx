import React, { useState } from 'react';
import {
  FileDown, BarChart2, PieChart as PieIcon, Download, Filter,
  CheckCircle2, Calendar, TrendingUp, AlertCircle, FileText,
  Users, Map as MapIcon, ArrowUpRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TerritoryStatus } from '../types';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const Reports = () => {
  const { territories, allWorkHistory } = useData();
  const [loading, setLoading] = useState(false);

  // Stats Calculation for Dashboard
  const totalTerritories = territories.length;
  const greenTerritories = territories.filter(t => t.status === TerritoryStatus.GREEN).length;
  const yellowTerritories = territories.filter(t => t.status === TerritoryStatus.YELLOW).length;
  const redTerritories = territories.filter(t => t.status === TerritoryStatus.RED).length;

  const coveragePercentage = totalTerritories > 0 ? Math.round((greenTerritories / totalTerritories) * 100) : 0;

  // Chart Data: Status Distribution
  const pieData = [
    { name: 'Em dia', value: greenTerritories, color: '#10b981' }, // Emerald-500
    { name: 'Atenção', value: yellowTerritories, color: '#f59e0b' }, // Amber-500
    { name: 'Atrasados', value: redTerritories, color: '#ef4444' }, // Red-500
  ];

  // Chart Data: Monthly Activity (Last 6 Months)
  const getMonthlyActivity = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return {
        date: d,
        monthName: format(d, 'MMM', { locale: ptBR }),
        fullMonth: format(d, 'MMMM', { locale: ptBR }),
        count: 0
      };
    }).reverse();

    allWorkHistory.forEach(work => {
      const workDate = new Date(work.date);
      const monthStats = last6Months.find(m => isSameMonth(m.date, workDate));
      if (monthStats) {
        monthStats.count++;
      }
    });

    return last6Months;
  };

  const barData = getMonthlyActivity();

  // Generators (Existing Logic Wrapped)
  const handleGeneralSummary = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Resumo Geral da Congregação", 105, 20, { align: "center" });

      // Stats Section
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Data do Relatório: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 20, 40);
      doc.text(`Total de Territórios: ${totalTerritories}`, 20, 50);
      doc.text(`Cobertura Atual: ${coveragePercentage}%`, 20, 60);

      const headers = [["Status", "Quantidade", "Porcentagem"]];
      const data = [
        ["Em dia (Verde)", greenTerritories, `${totalTerritories > 0 ? Math.round((greenTerritories / totalTerritories) * 100) : 0}%`],
        ["Atenção (Amarelo)", yellowTerritories, `${totalTerritories > 0 ? Math.round((yellowTerritories / totalTerritories) * 100) : 0}%`],
        ["Atrasados (Vermelho)", redTerritories, `${totalTerritories > 0 ? Math.round((redTerritories / totalTerritories) * 100) : 0}%`],
      ];

      autoTable(doc, {
        startY: 70, head: headers, body: data, theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Recent Activity
      doc.text("Últimas Atividades", 20, (doc as any).lastAutoTable.finalY + 15);

      const recentHistory = [...allWorkHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      const historyHeaders = [["Data", "Território", "Publicador"]];
      const historyData = recentHistory.map(h => {
        const territoryName = territories.find(t => t.id === h.territoryId)?.name || "N/A";
        return [format(new Date(h.date), "dd/MM/yyyy"), territoryName, h.publisherName];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20, head: historyHeaders, body: historyData, theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
      });

      doc.save(`Resumo_Geral_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      const territoriesData = territories.map(t => ({
        Codigo: t.code,
        Nome: t.name,
        Endereco: t.address,
        Status: t.status === 'green' ? 'Em dia' : t.status === 'yellow' ? 'Atenção' : 'Atrasado',
        Ultimo_Trabalho: t.lastWorkedDate ? format(new Date(t.lastWorkedDate), "dd/MM/yyyy") : 'Nunca',
        Ultimo_Publicador: t.lastWorkedBy || '-',
        Dias_Sem_Trabalhar: t.daysSinceWork
      }));

      const wsTerritories = XLSX.utils.json_to_sheet(territoriesData);
      XLSX.utils.book_append_sheet(wb, wsTerritories, "Territórios");

      const historyData = allWorkHistory.map(h => {
        const territory = territories.find(t => t.id === h.territoryId);
        return {
          Data: format(new Date(h.date), "dd/MM/yyyy"),
          Territorio_Codigo: territory?.code || 'N/A',
          Territorio_Nome: territory?.name || 'N/A',
          Publicador: h.publisherName,
          Observacoes: h.notes
        };
      });

      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, "Histórico");

      XLSX.writeFile(wb, `Dados_Territorios_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleOverdueReport = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      const overdue = territories.filter(t => t.status === TerritoryStatus.RED);

      doc.setFontSize(22);
      doc.setTextColor(231, 76, 60);
      doc.text("Relatório de Territórios Atrasados", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Atrasados: ${overdue.length}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 42);

      const headers = [["Cód", "Nome", "Dias", "Último Pub."]];
      const data = overdue.map(t => [t.code, t.name, `${t.daysSinceWork} dias`, t.lastWorkedBy || '-']);

      autoTable(doc, {
        startY: 50, head: headers, body: data, theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] },
      });

      doc.save(`Territorios_Atrasados_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Lista gerada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar lista");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReport = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      const today = new Date();
      const currentMonth = format(today, "MMMM 'de' yyyy", { locale: ptBR });

      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Relatório Mensal de Campo", 105, 20, { align: "center" });
      doc.setFontSize(16);
      doc.text(currentMonth, 105, 30, { align: "center" });

      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyWork = allWorkHistory.filter(h => new Date(h.date) >= firstDay);
      const uniqueTerritories = new Set(monthlyWork.map(w => w.territoryId)).size;
      const publishers = new Set(monthlyWork.map(w => w.publisherName)).size;

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Territórios Trabalhados: ${uniqueTerritories}`, 20, 50);
      doc.text(`Publicadores Ativos: ${publishers}`, 20, 60);
      doc.text(`Total de registros: ${monthlyWork.length}`, 20, 70);

      const headers = [["Data", "Território", "Publicador"]];
      const data = monthlyWork
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(h => {
          const t = territories.find(t => t.id === h.territoryId);
          return [format(new Date(h.date), "dd/MM/yyyy"), t?.code || 'N/A', h.publisherName];
        });

      autoTable(doc, {
        startY: 80, head: headers, body: data, theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`Relatorio_Mensal_${format(today, "MM-yyyy")}.pdf`);
      toast.success("Relatório mensal gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório mensal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
              <BarChart2 size={24} />
            </div>
            Inteligência de Dados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
            Análise executiva do desempenho da congregação.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto">
          <div className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Mês Atual
          </div>
          <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Ano
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cobertura Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{coveragePercentage}%</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${coveragePercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Territórios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalTerritories}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <MapIcon size={24} />
            </div>
          </div>
          <p className="text-xs text-green-500 font-bold flex items-center gap-1">
            <ArrowUpRight size={12} />
            Status Ativo
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atrasados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{redTerritories}</p>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
            Atenção Requerida
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atividade (6m)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{allWorkHistory.length}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className='flex gap-0.5 items-end h-3 mt-2'>
            {[30, 50, 40, 70, 60, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 bg-purple-200 dark:bg-purple-900/50 rounded-sm" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Status da Cobertura</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-\${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Trabalhos Realizados (Últimos 6 Meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="monthName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" name="Visitas" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Actions (Modern Grid) */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Central de Exportação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Report */}
          <div className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800/50 p-1 rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] h-full flex flex-col">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Relatório Geral</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-1">
                Resumo completo com estatísticas e lista de territórios.
              </p>
              <button
                onClick={handleGeneralSummary}
                disabled={loading}
                className="w-full py-3 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
              >
                {loading ? 'Processando...' : <><Download size={18} /> Baixar PDF</>}
              </button>
            </div>
          </div>

          {/* Excel Data */}
          <div className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800/50 p-1 rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] h-full flex flex-col">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileDown size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Dados Brutos (Excel)</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-1">
                Exporte a base de dados completa para análise externa.
              </p>
              <button
                onClick={handleExcelExport}
                disabled={loading}
                className="w-full py-3 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors"
              >
                {loading ? 'Processando...' : <><Download size={18} /> Baixar XLSX</>}
              </button>
            </div>
          </div>

          {/* Overdue Report */}
          <div className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800/50 p-1 rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-rose-500/50 transition-all hover:shadow-lg">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] h-full flex flex-col">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Territórios Atrasados</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-1">
                Lista de urgência para territórios não trabalhados há tempo.
              </p>
              <button
                onClick={handleOverdueReport}
                disabled={loading}
                className="w-full py-3 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 group-hover:bg-rose-600 group-hover:text-white transition-colors"
              >
                {loading ? 'Processando...' : <><Download size={18} /> Gerar Lista</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
