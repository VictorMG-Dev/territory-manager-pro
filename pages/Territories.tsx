
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, MapPin, Calendar, User, ChevronRight, Grid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TerritoryStatus } from '../types';
import { getStatusColor, getStatusText } from '../utils/helpers';

const TerritoryCard = ({ territory }: any) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="h-40 bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
        <img
          src={territory.image || `https://picsum.photos/seed/${territory.code}/400/200`}
          alt={territory.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-bold ${getStatusColor(territory.status)} shadow-lg`}>
          {getStatusText(territory.status)}
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-bold border border-white/20">
            {territory.code}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{territory.name}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
          <MapPin size={14} />
          {territory.address}
        </p>

        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">Último trabalho</span>
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar size={12} className="text-blue-500 dark:text-blue-400" />
              {territory.lastWorked}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">Publicador</span>
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
              <User size={12} className="text-blue-500 dark:text-blue-400" />
              {territory.publisher}
            </p>
          </div>
        </div>

        <Link to={`/territory/${territory.id}`} className="mt-5 w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-gray-600 dark:text-slate-300 py-2.5 rounded-xl text-sm font-bold transition-all">
          Ver Detalhes
          <ChevronRight size={16} />
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
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
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
          {filteredTerritories.map((t) => (
            <TerritoryCard key={t.id} territory={{
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
