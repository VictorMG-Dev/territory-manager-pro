
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, MapPin, Calendar, User, ChevronRight, Grid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TerritoryStatus } from '../types';
import { getStatusColor, getStatusText } from '../utils/helpers';

const TerritoryCard = ({ territory, index }: any) => {
  return (
    <div
      className="group bg-white dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden hover:-translate-y-1 relative"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="h-48 bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />
        <img
          src={territory.image || `https://picsum.photos/seed/${territory.code}/800/600`}
          alt={territory.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-white text-[10px] uppercase font-bold tracking-wider ${getStatusColor(territory.status)} shadow-lg backdrop-blur-md bg-opacity-90 flex items-center gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-white animate-pulse`} />
            {getStatusText(territory.status)}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-20">
          <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm font-bold border border-white/20 shadow-lg group-hover:bg-white/20 transition-all">
            {territory.code}
          </span>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-1">{territory.name}</h3>

        <div className="flex items-start gap-2 text-gray-500 dark:text-slate-400 text-sm mb-6 min-h-[40px]">
          <MapPin size={16} className="mt-0.5 shrink-0 text-blue-500/70" />
          <span className="line-clamp-2 leading-relaxed">{territory.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800/50">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar size={10} /> Último trabalho
            </span>
            <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
              {territory.lastWorked}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
              <User size={10} /> Publicador
            </span>
            <p className="text-xs font-bold text-gray-700 dark:text-slate-200 line-clamp-1">
              {territory.publisher}
            </p>
          </div>
        </div>

        <Link
          to={`/territory/${territory.id}`}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-95"
        >
          Ver Detalhes
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

import { useData } from '../contexts/DataContext';
import TerritoryForm from '../components/TerritoryForm';
import { toast } from 'react-hot-toast';

const Territories = () => {
  const { territories, addTerritory } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredTerritories = territories.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (data: any) => {
    addTerritory(data);
    setIsFormOpen(false);
    toast.success('Território criado com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Territórios</h1>
          <p className="text-gray-500 dark:text-slate-400">Gerencie e acompanhe o status dos campos.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Novo Território
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 outline-none bg-white dark:bg-slate-900 appearance-none min-w-[160px] font-medium text-gray-600 dark:text-slate-300 transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value={TerritoryStatus.GREEN}>Em dia (Verde)</option>
              <option value={TerritoryStatus.YELLOW}>Atenção (Amarelo)</option>
              <option value={TerritoryStatus.RED}>Atrasado (Vermelho)</option>
            </select>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {filteredTerritories.length > 0 ? (
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredTerritories.map((t, idx) => (
            <TerritoryCard key={t.id} index={idx} territory={{
              ...t,
              lastWorked: t.daysSinceWork > 900 ? 'Nunca trabalhado' : `${t.daysSinceWork} dias atrás`,
              publisher: t.lastWorkedBy || 'Ninguém'
            }} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 py-20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center text-center transition-colors">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-600 mb-4">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Nenhum território encontrado</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-sm mt-2">
            Não encontramos resultados para sua busca ou filtros. Tente ajustar os termos ou adicionar um novo território.
          </p>
        </div>
      )}

      {isFormOpen && (
        <TerritoryForm
          title="Novo Território"
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default Territories;
