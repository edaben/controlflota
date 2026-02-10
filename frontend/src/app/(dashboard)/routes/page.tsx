'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Route as RouteIcon, MapPin, Plus, Trash2, Edit2, Save, X, ChevronRight, ChevronDown } from 'lucide-react';
import Modal from '@/components/Modal';

export default function RoutesPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

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
        order: 0,
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/routes');
            setRoutes(data);
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error(err);
            alert('Error al eliminar la parada');
        }
    };

    const toggleExpand = (routeId: string) => {
        setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Rutas y Paradas</h1>
                    <p className="text-slate-400">Define tus rutas y asigna las geocercas (paradas) de Traccar</p>
                </div>
                <button
                    onClick={() => handleOpenRouteModal()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={20} />
                    Nueva Ruta
                </button>
            </div>

            <div className="space-y-4">
                {routes.map((route) => (
                    <div key={route.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
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
                                    <p className="text-sm text-slate-400">{route.description || 'Sin descripción'} • {route.stops?.length || 0} Paradas</p>
                                </div>
                            </div>
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
                        </div>

                        {/* Stops List (Expanded) */}
                        {expandedRouteId === route.id && (
                            <div className="border-t border-slate-800 bg-slate-900/50 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Paradas (Geocercas)</h4>
                                    <button
                                        onClick={() => handleOpenStopModal(route.id)}
                                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-400/10 px-3 py-1.5 rounded-lg transition-colors border border-emerald-400/20"
                                    >
                                        <Plus size={14} />
                                        Agregar Parada
                                    </button>
                                </div>

                                {route.stops && route.stops.length > 0 ? (
                                    <div className="space-y-2">
                                        {route.stops.map((stop: any) => (
                                            <div key={stop.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs font-bold border border-slate-600">
                                                        {stop.order}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium flex items-center gap-2">
                                                            {stop.name}
                                                            {stop.geofenceId && (
                                                                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">
                                                                    ID: {stop.geofenceId}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex gap-3">
                                                            {stop.geofenceId ? (
                                                                <span className="text-emerald-400/70 flex items-center gap-1">
                                                                    <MapPin size={10} /> Vinculado a Traccar
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-400/70 flex items-center gap-1">
                                                                    <MapPin size={10} /> Sin vincular
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenStopModal(route.id, stop)} className="text-slate-400 hover:text-primary-400 p-1">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteStop(stop.id)} className="text-slate-400 hover:text-red-400 p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                        No hay paradas en esta ruta.
                                        <br />
                                        <button onClick={() => handleOpenStopModal(route.id)} className="text-primary-400 hover:underline mt-1">
                                            Crear la primera parada
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {routes.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        No hay rutas configuradas. Crea una para comenzar a agregar paradas.
                    </div>
                )}
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

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowStopModal(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
