'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Settings, Route, MapPin, Gauge, Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '@/components/Modal';

export default function RulesPage() {
    const [activeTab, setActiveTab] = useState('segments');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);

    // Data states
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState([]);
    const [segmentRules, setSegmentRules] = useState([]);
    const [stopRules, setStopRules] = useState([]);
    const [speedZones, setSpeedZones] = useState([]);

    // Form states
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [routesRes, stopsRes, segRes, stopRes, speedRes] = await Promise.all([
                api.get('/routes'),
                // Necesitamos un endpoint para todas las paradas o extraerlas de las rutas
                api.get('/routes'),
                api.get('/segment-rules'),
                api.get('/stop-rules'),
                api.get('/speed-zones')
            ]);

            setRoutes(routesRes.data);
            // Extraer todas las paradas únicas de todas las rutas para los selects
            const allStops = routesRes.data.flatMap((r: any) => r.stops || []);
            setStops(allStops);

            setSegmentRules(segRes.data);
            setStopRules(stopRes.data);
            setSpeedZones(speedRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (rule: any = null) => {
        setEditingRule(rule);
        if (rule) {
            setFormData(rule);
        } else {
            // Default form data based on active tab
            if (activeTab === 'segments') {
                setFormData({ fromStopId: '', toStopId: '', maxTimeMinutes: 30 });
            } else if (activeTab === 'stops') {
                setFormData({ stopId: '', maxDwellTimeMinutes: 5, minDwellTimeMinutes: 1 });
            } else if (activeTab === 'speed') {
                setFormData({ name: '', traccarGeofenceId: '', maxSpeedKmH: 60 });
            }
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = activeTab === 'segments' ? '/segment-rules'
                : activeTab === 'stops' ? '/stop-rules'
                    : '/speed-zones';

            if (editingRule) {
                await api.put(`${endpoint}/${editingRule.id}`, formData);
            } else {
                await api.post(endpoint, formData);
            }

            setShowModal(false);
            fetchInitialData();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la regla');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta regla?')) return;
        try {
            const endpoint = activeTab === 'segments' ? '/segment-rules'
                : activeTab === 'stops' ? '/stop-rules'
                    : '/speed-zones';
            await api.delete(`${endpoint}/${id}`);
            fetchInitialData();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar la regla');
        }
    };

    const tabs = [
        { id: 'segments', label: 'Reglas de Segmentos', icon: Route },
        { id: 'stops', label: 'Reglas de Paradas', icon: MapPin },
        { id: 'speed', label: 'Zonas de Velocidad', icon: Gauge },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Configuración de Reglas</h1>
                    <p className="text-slate-400">Define reglas de infracciones para tu flota</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={20} />
                    Nueva Regla
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-primary-400 border-primary-400'
                                : 'text-slate-400 border-transparent hover:text-slate-300'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                {activeTab === 'segments' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Route className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Reglas de Segmentos</h3>
                                <p className="text-sm text-slate-400">Define tiempos máximos para recorrer segmentos de ruta</p>
                            </div>
                        </div>

                        {segmentRules.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {segmentRules.map((rule: any) => (
                                    <div key={rule.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-white font-medium">
                                                {rule.fromStop?.name} → {rule.toStop?.name}
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                Tiempo Máximo: {rule.maxTimeMinutes} minutos
                                                <span className="ml-2 text-emerald-400">• Multa: ${Number(rule.fineAmountUsd).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(rule)} className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No hay reglas de segmentos configuradas.
                                <br />
                                <button onClick={() => handleOpenModal()} className="text-primary-400 hover:text-primary-300 mt-4 font-medium">
                                    Crear primera regla
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stops' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <MapPin className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Reglas de Paradas</h3>
                                <p className="text-sm text-slate-400">Configura tiempos de permanencia en paradas</p>
                            </div>
                        </div>

                        {stopRules.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {stopRules.map((rule: any) => (
                                    <div key={rule.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-white font-medium">Parada: {rule.stop?.name}</div>
                                            <div className="text-sm text-slate-400">
                                                Dwell Time: {rule.minDwellTimeMinutes}-{rule.maxDwellTimeMinutes} min
                                                <span className="ml-2 text-emerald-400">• Multa: ${Number(rule.fineAmountUsd).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(rule)} className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No hay reglas de paradas configuradas.
                                <br />
                                <button onClick={() => handleOpenModal()} className="text-primary-400 hover:text-primary-300 mt-4 font-medium">
                                    Crear primera regla
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'speed' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Gauge className="text-amber-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Zonas de Velocidad</h3>
                                <p className="text-sm text-slate-400">Define límites de velocidad por zona</p>
                            </div>
                        </div>

                        {speedZones.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {speedZones.map((zone: any) => (
                                    <div key={zone.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-white font-medium">{zone.name} (Geofence: {zone.geofenceId})</div>
                                            <div className="text-sm text-slate-400">
                                                Límite: {zone.maxSpeedKmh} km/h
                                                <span className="ml-2 text-emerald-400">• Multa: ${Number(zone.fineAmountUsd).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(zone)} className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(zone.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No hay zonas de velocidad configuradas.
                                <br />
                                <button onClick={() => handleOpenModal()} className="text-primary-400 hover:text-primary-300 mt-4 font-medium">
                                    Crear primera zona
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Creación/Edición */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingRule ? 'Editar Regla' : 'Nueva Regla'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'segments' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Parada Origen</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.fromStopId}
                                    onChange={(e) => setFormData({ ...formData, fromStopId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {stops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Parada Destino</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.toStopId}
                                    onChange={(e) => setFormData({ ...formData, toStopId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {stops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Tiempo Máximo (minutos)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.maxTimeMinutes}
                                    onChange={(e) => setFormData({ ...formData, maxTimeMinutes: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Valor Multa (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        value={formData.fineAmountUsd}
                                        onChange={(e) => setFormData({ ...formData, fineAmountUsd: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'stops' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Parada</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.stopId}
                                    onChange={(e) => setFormData({ ...formData, stopId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {stops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Mínimo (min)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        value={formData.minDwellTimeMinutes}
                                        onChange={(e) => setFormData({ ...formData, minDwellTimeMinutes: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Máximo (min)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        value={formData.maxDwellTimeMinutes}
                                        onChange={(e) => setFormData({ ...formData, maxDwellTimeMinutes: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Valor Multa (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        value={formData.fineAmountUsd}
                                        onChange={(e) => setFormData({ ...formData, fineAmountUsd: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'speed' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de Zona</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Zona Escolar"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Ruta Asociada</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.routeId}
                                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Ruta...</option>
                                    {routes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">ID Geofence (Traccar)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.geofenceId}
                                    onChange={(e) => setFormData({ ...formData, geofenceId: e.target.value })}
                                    placeholder="ID de geocerca en Traccar"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Velocidad Máxima (km/h)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    value={formData.maxSpeedKmh}
                                    onChange={(e) => setFormData({ ...formData, maxSpeedKmh: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Valor Multa (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        value={formData.fineAmountUsd}
                                        onChange={(e) => setFormData({ ...formData, fineAmountUsd: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-6">
                        <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all">
                            {editingRule ? 'Actualizar' : 'Crear Regla'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

