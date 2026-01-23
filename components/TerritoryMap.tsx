import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { Territory, TerritoryStatus } from '../types';
import { useData } from '../contexts/DataContext';

// Fix for default Leaflet icons in webpack/vite environments
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TerritoryMapProps {
    territories: Territory[];
    onTerritoryClick?: (id: string) => void;
    editMode?: boolean;
    onPolygonChange?: (coords: [number, number][]) => void;
}

const STATUS_COLORS = {
    [TerritoryStatus.GREEN]: '#10B981',
    [TerritoryStatus.YELLOW]: '#F59E0B',
    [TerritoryStatus.RED]: '#EF4444'
};

const MapEvents = ({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) => {
    useMapEvents({
        click: onMapClick,
    });
    return null;
};

const TerritoryMap: React.FC<TerritoryMapProps> = ({ territories, onTerritoryClick, editMode = false, onPolygonChange }) => {
    // Default center (initial fallback)
    const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]);
    const [newPolygon, setNewPolygon] = useState<[number, number][]>([]);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    useEffect(() => {
        // Calculate center based on territories if available
        if (territories.length > 0) {
            const hasGeo = territories.find(t => t.geolocation?.center);
            if (hasGeo && hasGeo.geolocation.center) {
                setCenter([hasGeo.geolocation.center.lat, hasGeo.geolocation.center.lng]);
            }
        }
    }, [territories]);

    // Reset polygon when edit mode is toggled off
    useEffect(() => {
        if (!editMode) {
            setNewPolygon([]);
        }
    }, [editMode]);

    const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (editMode && onPolygonChange) {
            const newPoints = [...newPolygon, [e.latlng.lat, e.latlng.lng] as [number, number]];
            setNewPolygon(newPoints);
            onPolygonChange(newPoints);
        }
    };

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '1.5rem', overflow: 'hidden' }}
            className="z-0 shadow-inner"
            ref={setMapInstance}
        >
            <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Mapa Padrão">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satélite (Esri)">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Dark Mode (CartoDB)">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {editMode && <MapEvents onMapClick={handleMapClick} />}

            {/* Render Existing Territories */}
            {territories.map(territory => {
                const color = STATUS_COLORS[territory.status];

                // If has Polygon
                if (territory.geolocation?.type === 'Polygon' && territory.geolocation.coordinates) {
                    return (
                        <Polygon
                            key={territory.id}
                            positions={territory.geolocation.coordinates}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.4,
                                weight: 2,
                                className: 'transition-all duration-300 hover:fill-opacity-60'
                            }}
                            eventHandlers={{
                                click: () => onTerritoryClick?.(territory.id)
                            }}
                        >
                            <Popup closeButton={false} className="premium-popup">
                                <div className="p-1 min-w-[150px]">
                                    <div className={`h-1.5 w-8 rounded-full mb-2 bg-[${color}]`} style={{ backgroundColor: color }} />
                                    <h3 className="font-bold text-gray-900 text-base">{territory.name}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{territory.code}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: color }}></span>
                                        <span className="text-xs font-medium text-gray-600">{TerritoryStatus[territory.status]}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                }

                // If only has Center/Marker
                if (territory.geolocation?.center) {
                    return (
                        <Marker
                            key={territory.id}
                            position={[territory.geolocation.center.lat, territory.geolocation.center.lng]}
                            eventHandlers={{
                                click: () => onTerritoryClick?.(territory.id)
                            }}
                        >
                            <Popup closeButton={false}>
                                <div className="p-1 min-w-[120px]">
                                    <h3 className="font-bold text-gray-900">{territory.name}</h3>
                                    <p className="text-xs font-bold text-gray-500">{territory.code}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }
                return null;
            })}

            {/* Render Polygon currently being drawn */}
            {editMode && newPolygon.length > 0 && (
                <>
                    <Polygon
                        positions={newPolygon}
                        pathOptions={{ color: '#3b82f6', dashArray: '10, 10', fillOpacity: 0.1, weight: 2 }}
                    />
                    {newPolygon.map((point, idx) => (
                        <Marker key={idx} position={point} opacity={0.8} interactable={false} />
                    ))}
                </>
            )}
        </MapContainer>
    );
};

export default TerritoryMap;
