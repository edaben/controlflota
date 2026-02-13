'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Calendar, Car, MapPin, Filter, X, Gauge, Clock, Info, Trash2, CheckSquare, Square, User } from 'lucide-react';
import Modal from '@/components/Modal';

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function InfractionsPage() {
    const [infractions, setInfractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedInfraction, setSelectedInfraction] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filters, setFilters] = useState({
        vehicleId: '',
        dateFrom: '',
        dateTo: '',
        status: ''
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
        fetchInfractions();
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInfractions = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.status) params.append('status', filters.status);

            const { data } = await api.get(`/infractions?${params.toString()}`);
            setInfractions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (infId: string, newStatus: string) => {
        try {
            // Optimistic update
            setInfractions(prev => prev.map((inf: any) =>
                inf.id === infId ? { ...inf, status: newStatus } : inf
            ));

            await api.put(`/infractions/${infId}`, { status: newStatus });
            // No need to refetch if optimistic update worked, but fetching ensures consistency
            // fetchInfractions(); 
        } catch (error) {
            console.error('Error updating status:', error);
            fetchInfractions(); // Revert on error
        }
    };

    const handleApplyFilters = () => {
        setShowFilters(false);
        fetchInfractions();
    };

    const handleToggleSelectAll = () => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        if (selectedIds.length === infractions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(infractions.map(inf => inf.id));
        }
    };

    const handleToggleSelect = (id: string) => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar las ${selectedIds.length} infracciones seleccionadas? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.post('/infractions/bulk-delete', { ids: selectedIds });
            setInfractions(prev => prev.filter(inf => !selectedIds.includes(inf.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Error deleting infractions:', error);
            alert('Error al eliminar las infracciones seleccionadas.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearFilters = () => {
        setFilters({
            vehicleId: '',
            dateFrom: '',
            dateTo: '',
            status: ''
        });
    };

    const getInfractionTypeLabel = (type: string) => {
        const types: any = {
            'OVERSPEED': 'Exceso de Velocidad',
            'SPEED_VIOLATION': 'Exceso de Velocidad',
            'TIME_SEGMENT': 'Tiempo de Segmento',
            'DWELL_TIME': 'Tiempo en Parada',
            'STOP_VIOLATION': 'Violación de Parada',
            'ROUTE_DEVIATION': 'Desviación de Ruta',
            'GEOFENCE_EXIT': 'Salida de Geofence'
        };
        return types[type] || type;
    };

    const getInfractionTypeIcon = (type: string) => {
        switch (type) {
            case 'OVERSPEED':
            case 'SPEED_VIOLATION':
                return <Gauge size={14} className="text-red-400" />;
            case 'TIME_SEGMENT':
            case 'DWELL_TIME':
                return <Clock size={14} className="text-orange-400" />;
            default:
                return <AlertTriangle size={14} className="text-amber-400" />;
        }
    };

    const getStatusSelector = (inf: any) => {
        const colors: any = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'CONFIRMED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'PAID': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'DISMISSED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };

        return (
            <div className="relative inline-block">
                <select
                    value={inf.status}
                    onChange={(e) => handleStatusChange(inf.id, e.target.value)}
                    className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:ring-primary-500 ${colors[inf.status] || colors.PENDING}`}
                >
                    <option value="PENDING" className="bg-slate-800 text-yellow-400">Pendiente</option>
                    <option value="PAID" className="bg-slate-800 text-blue-400">Pagada</option>
                    <option value="DISMISSED" className="bg-slate-800 text-slate-400">Descartada</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string) => { // Keep for Read-Only Modal
        const colors: any = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'CONFIRMED': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'PAID': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'PROCESSED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'DISMISSED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: any = {
            'PENDING': 'Pendiente',
            'CONFIRMED': 'Confirmada',
            'PAID': 'Pagada',
            'PROCESSED': 'Procesada',
            'DISMISSED': 'Descartada'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.PENDING}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Extract location from the details JSON field
    const getLocation = (inf: any): string => {
        if (!inf.details) return 'N/A';
        try {
            const details = typeof inf.details === 'string' ? JSON.parse(inf.details) : inf.details;
            const address = details.address || details.location;
            const zone = details.geofenceName || details.zoneName || details.stopName;

            if (address) {
                if (!zone || zone.toLowerCase() === 'test' || zone === address) {
                    return address;
                }
                return `${zone}: ${address}`;
            }

            return zone || (details.latitude && details.longitude ? `${Number(details.latitude).toFixed(4)}, ${Number(details.longitude).toFixed(4)}` : 'Sin ubicación');
        } catch {
            return 'N/A';
        }
    };

    // Format date safely
    const formatDate = (dateStr: any): string => {
        if (!dateStr) return 'Sin fecha';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Sin fecha';
            return date.toLocaleString('es-EC', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return 'Sin fecha';
        }
    };

    // Get vehicle name from the infraction
    const getVehicleName = (inf: any): string => {
        if (inf.vehicle) {
            return inf.vehicle.plate || inf.vehicle.internalCode || inf.vehicle.name || 'Sin placa';
        }
        return 'N/A';
    };

    // Extract speed info from details
    const getSpeedInfo = (inf: any): string | null => {
        if (!inf.details) return null;
        try {
            const details = typeof inf.details === 'string' ? JSON.parse(inf.details) : inf.details;
            const speed = details.speed ?? details.speedKmh;
            const max = details.maxSpeedKmh ?? details.maxAllowed;

            if (speed !== undefined && max !== undefined) {
                return `${Number(speed).toFixed(0)} km/h (máx: ${max} km/h)`;
            }
            if (speed !== undefined) {
                return `${Number(speed).toFixed(0)} km/h`;
            }
            return null;
        } catch {
            return null;
        }
    };

    // Parse details for the modal
    const parseDetails = (inf: any): any => {
        if (!inf.details) return {};
        try {
            return typeof inf.details === 'string' ? JSON.parse(inf.details) : inf.details;
        } catch {
            return {};
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Infracciones Detectadas</h1>
                    <p className="text-slate-400">Registro de infracciones capturadas por el sistema</p>
                </div>
                <div className="flex gap-3">
                    {hasPermission(user, PERMISSIONS.BULK_DELETE) && selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                            <Trash2 size={20} className={isDeleting ? 'animate-pulse' : ''} />
                            Eliminar ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
                    >
                        <Filter size={20} />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium w-10 text-center">
                                <button
                                    onClick={handleToggleSelectAll}
                                    disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                    className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    {selectedIds.length === infractions.length && infractions.length > 0 ? (
                                        <CheckSquare size={18} className="text-primary-400" />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 font-medium">Fecha/Hora</th>
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Tipo</th>
                            <th className="px-6 py-4 font-medium">Ubicación</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {infractions.map((inf: any) => (
                            <tr
                                key={inf.id}
                                className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(inf.id) ? 'bg-primary-500/5' : ''}`}
                            >
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleToggleSelect(inf.id)}
                                        disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                        className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        {selectedIds.includes(inf.id) ? (
                                            <CheckSquare size={18} className="text-primary-400" />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span className="text-sm">
                                            {formatDate(inf.detectedAt || inf.timestamp || inf.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-slate-400" />
                                        <span className="text-white font-medium">{getVehicleName(inf)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getInfractionTypeIcon(inf.type)}
                                        <span className="text-sm text-slate-300">{getInfractionTypeLabel(inf.type)}</span>
                                    </div>
                                    {getSpeedInfo(inf) && (
                                        <div className="text-xs text-red-400 mt-1 ml-5">{getSpeedInfo(inf)}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin size={14} />
                                        <span>{getLocation(inf)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(inf.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedInfraction(inf)}
                                        className="text-primary-400 hover:text-primary-300 text-sm font-medium hover:underline transition-colors"
                                    >
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {infractions.map((inf: any) => (
                    <div
                        key={inf.id}
                        className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 ${selectedIds.includes(inf.id) ? 'ring-2 ring-primary-500/50' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleToggleSelect(inf.id)}
                                    className="text-slate-500 hover:text-primary-400 transition-colors"
                                >
                                    {selectedIds.includes(inf.id) ? (
                                        <CheckSquare size={20} className="text-primary-400" />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </button>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {getInfractionTypeIcon(inf.type)}
                                        <span className="text-sm font-bold text-white">{getInfractionTypeLabel(inf.type)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <Calendar size={12} className="text-blue-400" />
                                        <span>{formatDate(inf.detectedAt || inf.timestamp || inf.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            {getStatusBadge(inf.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/50">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vehículo</p>
                                <div className="flex items-center gap-1.5">
                                    <Car size={14} className="text-slate-400" />
                                    <span className="text-sm text-white font-medium">{getVehicleName(inf)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Ubicación</p>
                                <div className="flex items-start gap-1.5">
                                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-300 line-clamp-1">{getLocation(inf)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedInfraction(inf)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-primary-400 rounded-xl font-bold transition-all border border-slate-700"
                        >
                            Ver Detalles Completos
                        </button>
                    </div>
                ))}
            </div>

            {infractions.length === 0 && !loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                    No se han detectado infracciones con estos filtros.
                </div>
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedInfraction} onClose={() => setSelectedInfraction(null)} title="Detalles de Infracción">
                {selectedInfraction && (() => {
                    const details = parseDetails(selectedInfraction);
                    return (
                        <div className="space-y-5">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tipo</p>
                                    <div className="flex items-center gap-2">
                                        {getInfractionTypeIcon(selectedInfraction.type)}
                                        <span className="text-white font-medium">{getInfractionTypeLabel(selectedInfraction.type)}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                                    {getStatusBadge(selectedInfraction.status)}
                                </div>
                            </div>

                            {/* Date, Vehicle & Owner */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha/Hora</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span className="text-white text-sm">
                                            {formatDate(selectedInfraction.detectedAt || selectedInfraction.timestamp || selectedInfraction.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dueño/Responsable</p>
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-amber-400" />
                                        <span className="text-white text-sm">{details.object_owner || details.owner || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehículo</p>
                                    <div className="flex items-center gap-2">
                                        <Car size={14} className="text-emerald-400" />
                                        <span className="text-white font-medium">{getVehicleName(selectedInfraction)}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p>
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-red-400 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-white text-sm font-medium">{getLocation(selectedInfraction)}</p>
                                            {details.reference && (
                                                <p className="text-xs text-slate-400 mt-1 italic">Ref: {details.reference}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(details.latitude && details.longitude) && (
                                <div className="flex justify-end">
                                    <a
                                        href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded transition-colors"
                                    >
                                        Ver en Mapa ↗
                                    </a>
                                </div>
                            )}

                            {/* Speed Details (for overspeed) */}
                            {(selectedInfraction.type === 'OVERSPEED' || selectedInfraction.type === 'SPEED_VIOLATION') && (
                                <div className="bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                                    <p className="text-xs text-red-400 uppercase tracking-wider mb-2">Detalles de Velocidad</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Velocidad Detectada</p>
                                            <p className="text-xl font-bold text-red-400">
                                                {details.speed || details.speedKmh || 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Velocidad Máxima</p>
                                            <p className="text-xl font-bold text-emerald-400">
                                                {details.maxSpeedKmh || details.maxAllowed || 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Exceso</p>
                                            <p className="text-xl font-bold text-amber-400">
                                                {details.excessKmh !== undefined
                                                    ? `+${details.excessKmh}`
                                                    : ((details.speed || details.speedKmh) && (details.maxSpeedKmh || details.maxAllowed)
                                                        ? `+${(Number(details.speed || details.speedKmh) - Number(details.maxSpeedKmh || details.maxAllowed)).toFixed(0)}`
                                                        : 'N/A')} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fine amount if exists */}
                            {details.fineAmountUsd && (
                                <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-800/30">
                                    <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Multa</p>
                                    <p className="text-2xl font-bold text-amber-400">${Number(details.fineAmountUsd).toFixed(2)} USD</p>
                                </div>
                            )}

                            {/* Raw details */}
                            {Object.keys(details).length > 0 && (
                                <details className="group">
                                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1">
                                        <Info size={12} />
                                        Ver datos técnicos
                                    </summary>
                                    <pre className="mt-2 bg-slate-950 p-3 rounded-lg text-xs text-slate-400 overflow-x-auto max-h-48 overflow-y-auto border border-slate-800">
                                        {JSON.stringify(details, null, 2)}
                                    </pre>
                                </details>
                            )}

                            {/* ID */}
                            <p className="text-xs text-slate-600 text-center">ID: {selectedInfraction.id}</p>
                        </div>
                    );
                })()}
            </Modal>

            {/* Filters Modal */}
            <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filtrar Infracciones">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Vehículo
                        </label>
                        <select
                            value={filters.vehicleId}
                            onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Todos los vehículos</option>
                            {vehicles.map((vehicle: any) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate || vehicle.internalCode}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha Desde
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha Hasta
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="PAID">Pagada</option>
                            <option value="CONFIRMED">Confirmada</option>
                            <option value="DISMISSED">Descartada</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleApplyFilters}
                            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                        <button
                            onClick={handleClearFilters}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
