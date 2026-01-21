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
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mapa Global</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Visualize e gerencie as áreas dos territórios.</p>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="bg-blue-600 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all"
            >
              <Edit size={18} />
              Delimitar Área
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-all"
              >
                <Trash size={18} />
                Cancelar
              </button>
              <button
                onClick={savePolygon}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all"
              >
                <Save size={18} />
                Salvar Área
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden relative z-0 transition-colors">
        <TerritoryMap
          territories={territories}
          editMode={isEditing}
          onPolygonChange={handlePolygonChange}
        />

        {!isEditing && (
          <div className="absolute bottom-6 right-6 z-[1000]">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 space-y-3 transition-colors">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Legenda</h4>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Em dia</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Atenção</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Atrasado</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
