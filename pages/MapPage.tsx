import React, { useState } from 'react';
import {
  Maximize,
  Layers as LayersIcon,
  Navigation,
  Info,
  ChevronLeft,
  Edit,
  Save,
  Trash
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import TerritoryMap from '../components/TerritoryMap';
import { TerritoryStatus } from '../types';
import { toast } from 'react-hot-toast';

const MapPage = () => {
  const { territories, updateTerritory } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [tempPolygon, setTempPolygon] = useState<[number, number][]>([]);

  // Filter only those with location to calc center? Map handles it.

  const handlePolygonChange = (coords: [number, number][]) => {
    setTempPolygon(coords);
  };

  const startEditing = () => {
    const territoryToEdit = prompt("Digite o Código do Território para editar a área (ex: T-01):");
    if (!territoryToEdit) return;

    const territory = territories.find(t => t.code === territoryToEdit);
    if (territory) {
      setSelectedTerritoryId(territory.id);
      setIsEditing(true);
      setTempPolygon([]);
      toast("Clique no mapa para adicionar pontos. Clique em SALVAR quando terminar.", { icon: '🗺️', duration: 5000 });
    } else {
      toast.error("Território não encontrado.");
    }
  };

  const savePolygon = () => {
    if (selectedTerritoryId && tempPolygon.length > 2) {
      updateTerritory(selectedTerritoryId, {
        geolocation: {
          type: 'Polygon',
          coordinates: tempPolygon,
          area: 0, // Should calc area ideally
          center: { lat: tempPolygon[0][0], lng: tempPolygon[0][1] } // Approx center
        }
      });
      setIsEditing(false);
      setSelectedTerritoryId(null);
      setTempPolygon([]);
      toast.success("Área do território atualizada!");
    } else {
      toast.error("Desenhe pelo menos 3 pontos para formar uma área.");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedTerritoryId(null);
    setTempPolygon([]);
  };

  return (
  return (
    <div className="relative w-full h-[calc(100vh-80px)] rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl animate-in fade-in duration-700">

      {/* Floating Header Card */}
      {!isEditing && (
        <div className="absolute top-6 left-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 max-w-sm animate-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 text-white">
              <Navigation size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mapa Global</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Visualize os territórios. Use o seletor de camadas (no canto inferior) para ver modo Satélite ou Dark.
          </p>
          <div className="flex gap-4 text-xs font-bold text-gray-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              Em Dia
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              Atenção
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
              Atrasados
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!isEditing && (
        <div className="absolute top-6 right-6 z-[400] animate-in slide-in-from-right-4 duration-500">
          <button
            onClick={startEditing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            <Edit size={18} />
            <span className="hidden sm:inline">Delimitar Área</span>
          </button>
        </div>
      )}

      {/* Editing Mode UI Overlay */}
      {isEditing && (
        <>
          {/* Top Instruction Banner */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-md px-4 pointer-events-none">
            <div className="bg-slate-900/90 text-white backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
              <Info size={20} className="text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">Modo de Edição Ativo</p>
                <p className="text-xs text-slate-300">Clique pontos no mapa para desenhar o polígono.</p>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] flex gap-3 animate-in slide-in-from-bottom-6 duration-300">
            <button
              onClick={cancelEdit}
              className="bg-white text-rose-600 px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              <Trash size={18} />
              Cancelar
            </button>
            <button
              onClick={savePolygon}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Território
            </button>
          </div>
        </>
      )}

      <TerritoryMap
        territories={territories}
        editMode={isEditing}
        onPolygonChange={handlePolygonChange}
      />
    </div>
  );
};

export default MapPage;
