import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
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
    // Default center (São Paulo roughly, or calculate bounds)
    const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]);
    const [newPolygon, setNewPolygon] = useState<[number, number][]>([]);

    useEffect(() => {
        // Calculate center based on territories if available
        if (territories.length > 0) {
            const hasGeo = territories.find(t => t.geolocation?.center);
            if (hasGeo && hasGeo.geolocation.center) {
                setCenter([hasGeo.geolocation.center.lat, hasGeo.geolocation.center.lng]);
            }
        }
    }, [territories]);

    const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (editMode && onPolygonChange) {
            const newPoints = [...newPolygon, [e.latlng.lat, e.latlng.lng] as [number, number]];
            setNewPolygon(newPoints);
            onPolygonChange(newPoints);
        }
    };

    return (
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

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
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.4 }}
                            eventHandlers={{
                                click: () => onTerritoryClick?.(territory.id)
                            }}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold">{territory.name}</h3>
                                    <p className="text-sm text-gray-600">{territory.code}</p>
                                    <p className="text-xs mt-1">Status: {territory.status}</p>
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
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold">{territory.name}</h3>
                                    <p className="text-sm text-gray-600">{territory.code}</p>
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
                        pathOptions={{ color: 'blue', dashArray: '5, 5', fillOpacity: 0.2 }}
                    />
                    {newPolygon.map((point, idx) => (
                        <Marker key={idx} position={point} opacity={0.6} />
                    ))}
                </>
            )}
        </MapContainer>
    );
};

export default TerritoryMap;
