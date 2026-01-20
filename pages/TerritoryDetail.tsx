
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Edit2,
  Trash2,
  ClipboardCheck,
  History,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  Plus,
  PlusCircle,
  Search
} from 'lucide-react';
import { TerritoryStatus } from '../types';
import { getStatusColor, getStatusText } from '../utils/helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useData } from '../contexts/DataContext';
import TerritoryForm from '../components/TerritoryForm';
import WorkRegisterModal from '../components/WorkRegisterModal';
import { toast } from 'react-hot-toast';

const TerritoryDetail = () => {
  const { id } = useParams();
  const { getTerritory, updateTerritory, deleteTerritory, getHistory, registerWork } = useData();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'photos'>('info');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isWorkRegisterOpen, setIsWorkRegisterOpen] = useState(false);

  const territory = getTerritory(id || '');
  const history = id ? getHistory(id) : [];

  if (!territory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="text-gray-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Território não encontrado</h2>
        <Link to="/territories" className="mt-4 text-blue-600 font-bold hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const handleUpdate = (data: any) => {
    if (id) {
      updateTerritory(id, data);
      setIsEditOpen(false);
      toast.success('Território atualizado com sucesso!');
    }
  };

  const handleRegisterWork = (data: any) => {
    registerWork(data);
    setIsWorkRegisterOpen(false);
    toast.success('Trabalho registrado com sucesso!');
    setActiveTab('history');
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este território?')) {
      if (id) {
        deleteTerritory(id);
        toast.success('Território excluído.');
        window.location.hash = '#/territories';
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <Link to="/territories" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
          <div className="p-2 bg-white rounded-xl border border-gray-100 group-hover:border-blue-200 shadow-sm">
            <ArrowLeft size={20} />
          </div>
          <span className="font-semibold hidden sm:inline">Voltar para lista</span>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="p-3 bg-white text-gray-500 hover:text-blue-600 rounded-xl border border-gray-100 shadow-sm transition-all"
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={handleDelete}
            className="p-3 bg-white text-gray-500 hover:text-rose-600 rounded-xl border border-gray-100 shadow-sm transition-all"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setIsWorkRegisterOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <ClipboardCheck size={20} />
            Registrar Trabalho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-64 sm:h-80 bg-gray-200 relative">
              <img src={territory.images[0] || `https://picsum.photos/seed/${territory.code}/800/600`} alt={territory.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-600 px-3 py-1 rounded-lg text-sm font-bold tracking-wider">
                    {territory.code}
                  </span>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(territory.status)}`}>
                    {getStatusText(territory.status)}
                  </div>
                </div>
                <h1 className="text-3xl font-bold leading-tight">{territory.name}</h1>
                <p className="flex items-center gap-2 text-white/80 mt-2 text-sm">
                  <MapPin size={16} />
                  {territory.address}
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="flex gap-8 border-b border-gray-100 mb-8">
                {(['info', 'history', 'photos'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab === 'info' && 'Informações'}
                    {tab === 'history' && 'Histórico'}
                    {tab === 'photos' && 'Fotos'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center text-center">
                      <Clock className="text-blue-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tempo Decorrido</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">{territory.daysSinceWork} dias</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center text-center">
                      <User className="text-blue-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Último por</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">{territory.lastWorkedBy || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center text-center">
                      <History className="text-blue-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {territory.lastWorkedDate ? format(new Date(territory.lastWorkedDate), 'dd MMM, yyyy', { locale: ptBR }) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="text-blue-500" size={20} />
                      Observações
                    </h3>
                    <p className="text-gray-600 leading-relaxed bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                      {territory.observations || 'Nenhuma observação registrada.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="text-blue-500" size={20} />
                      Mapa de Localização
                    </h3>
                    <div className="h-64 bg-gray-100 rounded-3xl border border-gray-200 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        Mapa Interativo Carregando...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  {history.length > 0 ? history.map((record, idx) => (
                    <div key={record.id} className="relative flex gap-6">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-md ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {history.length - idx}
                        </div>
                        {idx !== history.length - 1 && <div className="flex-1 w-0.5 bg-gray-100 my-2" />}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h4 className="font-bold text-gray-900">{record.publisherName}</h4>
                            <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100">
                              {format(new Date(record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{record.notes}</p>
                          {record.photos && record.photos.length > 0 && (
                            <div className="mt-4 flex gap-2">
                              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                <ImageIcon size={14} />
                                {record.photos.length} fotos registradas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-gray-400">
                      Nenhum histórico encontrado.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'photos' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                  {territory.images.map((img, i) => (
                    typeof img === 'string' ? (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-pointer">
                        <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <Plus className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={32} />
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-pointer">
                        <img src={img.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <Plus className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={32} />
                        </div>
                      </div>
                    )
                  ))}
                  <button className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-blue-500">
                    <PlusCircle size={32} className="mb-2" />
                    <span className="text-xs font-bold">Adicionar Foto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Informações Técnicas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Área Aproximada</span>
                <span className="text-sm font-bold text-gray-900">{territory.geolocation?.area || 0} m²</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Total de Visitas</span>
                <span className="text-sm font-bold text-gray-900">{history.length} registros</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Cadastrado em</span>
                <span className="text-sm font-bold text-gray-900">
                  {territory.createdAt ? format(new Date(territory.createdAt), 'dd/MM/yyyy') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Tipo</span>
                <span className="text-sm font-bold text-gray-900">Residencial/Comercial</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <h3 className="text-xl font-bold mb-4">Dica da IA</h3>
            <p className="text-sm text-white/90 leading-relaxed mb-6">
              "Este território está com status {getStatusText(territory.status)}. Verifique se há planos para revisitar em breve."
            </p>
            <button className="w-full bg-white text-blue-600 py-3 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-all">
              Perguntar ao Assistente
            </button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <TerritoryForm
          title="Editar Território"
          initialData={territory}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditOpen(false)}
        />
      )}

      {isWorkRegisterOpen && (
        <WorkRegisterModal
          territoryId={territory.id}
          territoryName={territory.name}
          onSubmit={handleRegisterWork}
          onCancel={() => setIsWorkRegisterOpen(false)}
        />
      )}
    </div>
  );
};

export default TerritoryDetail;
