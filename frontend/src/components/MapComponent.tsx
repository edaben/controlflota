'use client'

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leafet icon
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface GeofenceMapProps {
    stops: any[];
    center?: [number, number];
    zoom?: number;
}

// Component to auto-center map
function MapUpdater({ center, stops }: { center?: [number, number], stops: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (stops.length > 0) {
            const bounds = L.latLngBounds(stops.map(s => [s.latitude || 0, s.longitude || 0]));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.setView(center);
        }
    }, [center, stops, map]);

    return null;
}

export default function MapComponent({ stops, center = [-0.1807, -78.4678], zoom = 12 }: GeofenceMapProps) {
    // Filter valid stops with coordinates
    const validStops = stops.filter(s => s.latitude && s.longitude);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className="w-full h-full rounded-xl z-0"
            style={{ minHeight: '400px' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater center={center} stops={validStops} />

            {validStops.map((stop) => (
                <React.Fragment key={stop.id}>
                    <Marker position={[stop.latitude, stop.longitude]} icon={icon}>
                        <Popup>
                            <strong>{stop.name}</strong> <br />
                            orden: {stop.order}
                        </Popup>
                    </Marker>

                    {/* Render Geofence Geometry */}
                    {stop.geofenceType === 'circle' && stop.geofenceRadius && (
                        <Circle
                            center={[stop.latitude, stop.longitude]}
                            radius={stop.geofenceRadius}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                        />
                    )}

                    {stop.geofenceType === 'polygon' && stop.geofenceCoordinates && (
                        <Polygon
                            positions={stop.geofenceCoordinates.map((p: any) => [p.lat, p.lng])}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                        />
                    )}
                </React.Fragment>
            ))}
        </MapContainer>
    );
}
