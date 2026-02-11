'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Route as RouteIcon, MapPin, Plus, Trash2, Edit2, Save, X, ChevronRight, ChevronDown } from 'lucide-react';
import Modal from '@/components/Modal';
import dynamic from 'next/dynamic';

// Importar mapa dinámicamente para evitar problemas de SSR con Leaflet
import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

// Importar mapa dinámicamente para evitar problemas de SSR con Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-900 animate-pulse rounded-xl flex items-center justify-center text-slate-500">Cargando Mapa...</div>
});

export default function RoutesPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
    const [selectedRouteLocal, setSelectedRouteLocal] = useState<any>(null); // Para el mapa

    // Modal states
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState<any>(null);
    const [editingStop, setEditingStop] = useState<any>(null);

    // Form data
    const [routeForm, setRouteForm] = useState({ name: '', code: '', description: '' });
    const [stopForm, setStopForm] = useState({
        routeId: '',
        name: '',
        geofenceId: '',
        // Campos nuevos
        geofenceType: 'circle',
        geofenceRadius: 100,
        geofenceCoordinates: '', // JSON Stringify
        order: 0,
        latitude: '',
        longitude: ''
    });

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr);
                setUser(parsedUser);
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/routes');
            setRoutes(data);
            if (data.length > 0) {
                // Seleccionar primera ruta por defecto para el mapa
                setSelectedRouteLocal(data[0]);
                setExpandedRouteId(data[0].id);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Route Handlers ---

    const handleOpenRouteModal = (route: any = null) => {
        setEditingRoute(route);
        if (route) {
            setRouteForm({ name: route.name, code: route.code || '', description: route.description || '' });
        } else {
            setRouteForm({ name: '', code: '', description: '' });
        }
        setShowRouteModal(true);
    };

    const handleSubmitRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRoute) {
                await api.put(`/routes/${editingRoute.id}`, routeForm);
            } else {
                await api.post('/routes', routeForm);
            }
            setShowRouteModal(false);
            fetchRoutes();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la ruta');
        }
    };

    const handleDeleteRoute = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar esta ruta y todas sus paradas?')) return;
        try {
            await api.delete(`/routes/${id}`);
            fetchRoutes();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar la ruta');
        }
    };

    // --- Stop Handlers ---

    const handleOpenStopModal = (routeId: string, stop: any = null) => {
        setEditingStop(stop);
        if (stop) {
            setStopForm({
                routeId,
                name: stop.name,
                geofenceId: stop.geofenceId || '',
                geofenceType: stop.geofenceType || 'circle',
                geofenceRadius: stop.geofenceRadius || 100,
                geofenceCoordinates: stop.geofenceCoordinates ? JSON.stringify(stop.geofenceCoordinates) : '',
                order: stop.order,
                latitude: stop.latitude || '',
                longitude: stop.longitude || ''
            });
        } else {
            // Calcular siguiente orden
            const route = routes.find(r => r.id === routeId);
            const nextOrder = route?.stops?.length ? Math.max(...route.stops.map((s: any) => s.order)) + 1 : 1;

            setStopForm({
                routeId,
                name: '',
                geofenceId: '',
                geofenceType: 'circle',
                geofenceRadius: 100,
                geofenceCoordinates: '',
                order: nextOrder,
                latitude: '',
                longitude: ''
            });
        }
        setShowStopModal(true);
    };

    const handleSubmitStop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...stopForm,
                latitude: stopForm.latitude ? parseFloat(stopForm.latitude) : null,
                longitude: stopForm.longitude ? parseFloat(stopForm.longitude) : null,
                geofenceCoordinates: stopForm.geofenceCoordinates ? JSON.parse(stopForm.geofenceCoordinates) : undefined
            };

            if (editingStop) {
                await api.put(`/stops/${editingStop.id}`, payload);
            } else {
                await api.post('/stops', payload);
            }
            setShowStopModal(false);
            fetchRoutes(); // Refrescar para ver la nueva parada
        } catch (err) {
            console.error(err);
            alert('Error al guardar la parada');
        }
    };

    const handleDeleteStop = async (id: string) => {
        if (!confirm('¿Eliminar esta parada?')) return;
        try {
            await api.delete(`/stops/${id}`);
            fetchRoutes();
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || 'Error desconocido';
            alert(`Error al eliminar la parada: ${msg}`);
        }
    };

    const toggleExpand = (routeId: string) => {
        const route = routes.find(r => r.id === routeId);
        setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
        if (route) setSelectedRouteLocal(route);
    };

    return (
        <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Rutas y Paradas</h1>
                    <p className="text-slate-400">Define tus rutas y asigna las geocercas (paradas) de Traccar</p>
                </div>
                {hasPermission(user, PERMISSIONS.MANAGE_ROUTES) && (
                    <button
                        onClick={() => handleOpenRouteModal()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                    >
                        <Plus size={20} />
                        Nueva Ruta
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* List Panel */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                    {routes.map((route) => (
                        <div key={route.id} className={`bg-slate-900 border ${expandedRouteId === route.id ? 'border-blue-500/50' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300 shadow-lg`}>
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                                onClick={() => toggleExpand(route.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-slate-400">
                                        {expandedRouteId === route.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <RouteIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{route.name}</h3>
                                        <p className="text-sm text-slate-400">{route.stops?.length || 0} Paradas</p>
                                    </div>
                                </div>
                                {hasPermission(user, PERMISSIONS.MANAGE_ROUTES) && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenRouteModal(route); }}
                                            className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteRoute(route.id, e)}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Stops List (Expanded) */}
                            {expandedRouteId === route.id && (
                                <div className="border-t border-slate-800 bg-slate-900/50 p-4">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Geocercas</h4>
                                        {hasPermission(user, PERMISSIONS.MANAGE_ROUTES) && (
                                            <button
                                                onClick={() => handleOpenStopModal(route.id)}
                                                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-400/10 px-3 py-1.5 rounded-lg transition-colors border border-emerald-400/20"
                                            >
                                                <Plus size={14} />
                                                Agregar
                                            </button>
                                        )}
                                    </div>

                                    {route.stops && route.stops.length > 0 ? (
                                        <div className="space-y-2">
                                            {route.stops.map((stop: any) => (
                                                <div key={stop.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs font-bold border border-slate-600">
                                                            {stop.order}
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium text-sm flex items-center gap-2">
                                                                {stop.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-mono">
                                                                ID: {stop.geofenceId || 'N/A'} • {stop.geofenceType || 'punto'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {hasPermission(user, PERMISSIONS.MANAGE_ROUTES) && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenStopModal(route.id, stop)} className="text-slate-400 hover:text-primary-400 p-1">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteStop(stop.id)} className="text-slate-400 hover:text-red-400 p-1">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                            Sin geocercas.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {routes.length === 0 && !loading && (
                        <div className="text-center py-12 text-slate-500">
                            No hay rutas configuradas.
                        </div>
                    )}
                </div>

                {/* Map Panel */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
                    {selectedRouteLocal ? (
                        <>
                            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 shadow-lg">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <RouteIcon size={16} className="text-blue-400" />
                                    {selectedRouteLocal.name}
                                </h3>
                                <p className="text-xs text-slate-400">{selectedRouteLocal.stops?.length || 0} geocercas visibles</p>
                            </div>
                            <MapComponent stops={selectedRouteLocal.stops || []} />
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                            <MapPin size={48} className="mb-4 opacity-50" />
                            <p>Selecciona una ruta para ver sus geocercas en el mapa</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Route Modal */}
            <Modal
                isOpen={showRouteModal}
                onClose={() => setShowRouteModal(false)}
                title={editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
            >
                <form onSubmit={handleSubmitRoute} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de la Ruta</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            placeholder="Ej: Ruta 1 - Centro a Norte"
                            value={routeForm.name}
                            onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Código (Opcional)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            placeholder="Ej: R001"
                            value={routeForm.code}
                            onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            rows={3}
                            value={routeForm.description}
                            onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowRouteModal(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </form>
            </Modal>

            {/* Stop Modal */}
            <Modal
                isOpen={showStopModal}
                onClose={() => setShowStopModal(false)}
                title={editingStop ? 'Editar Parada' : 'Nueva Parada'}
            >
                <form onSubmit={handleSubmitStop} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de Parada</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            placeholder="Ej: Parada Estadio"
                            value={stopForm.name}
                            onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                        />
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <label className="block text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                            <MapPin size={16} /> ID Geocerca Traccar (Crítico)
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-blue-400 font-mono"
                            placeholder="Ej: 12 (ID numérico en Traccar)"
                            value={stopForm.geofenceId}
                            onChange={(e) => setStopForm({ ...stopForm, geofenceId: e.target.value })}
                        />
                        <p className="text-xs text-blue-300/70 mt-2">
                            * Este ID debe coincidir exactamente con el ID de la geocerca creada en tu servidor Traccar.
                            Sin esto, el sistema no detectará llegadas.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Orden en Ruta</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                value={stopForm.order}
                                onChange={(e) => setStopForm({ ...stopForm, order: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Campos manuales de geometría (opcional para edición manual) */}
                    <div className="pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 mb-3">Geometría (Opcional)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Latitud Centro</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                                    value={stopForm.latitude}
                                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Longitud Centro</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                                    value={stopForm.longitude}
                                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowStopModal(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
