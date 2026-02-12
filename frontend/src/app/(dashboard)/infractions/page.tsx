'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Calendar, Car, MapPin, Filter, X, Gauge, Clock, Info } from 'lucide-react';
import Modal from '@/components/Modal';

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function InfractionsPage() {
    const [infractions, setInfractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [selectedInfraction, setSelectedInfraction] = useState<any>(null);
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

    const handleApplyFilters = () => {
        setShowFilters(false);
        fetchInfractions();
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

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'CONFIRMED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'PROCESSED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'DISMISSED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: any = {
            'PENDING': 'Pendiente',
            'CONFIRMED': 'Confirmada',
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
            // Try various fields where location might be stored
            return details.geofenceName
                || details.zoneName
                || details.stopName
                || details.location
                || details.address
                || (details.latitude && details.longitude ? `${Number(details.latitude).toFixed(4)}, ${Number(details.longitude).toFixed(4)}` : null)
                || 'Sin ubicación';
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
            if (details.speed !== undefined && details.maxSpeedKmh !== undefined) {
                return `${Number(details.speed).toFixed(0)} km/h (máx: ${details.maxSpeedKmh} km/h)`;
            }
            if (details.speedKmh !== undefined) {
                return `${Number(details.speedKmh).toFixed(0)} km/h`;
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
                <button
                    onClick={() => setShowFilters(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
                >
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
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
                            <tr key={inf.id} className="hover:bg-slate-800/30 transition-colors">
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
                        {infractions.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No hay infracciones registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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

                            {/* Date & Vehicle */}
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
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehículo</p>
                                    <div className="flex items-center gap-2">
                                        <Car size={14} className="text-emerald-400" />
                                        <span className="text-white font-medium">{getVehicleName(selectedInfraction)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-red-400" />
                                    <span className="text-white text-sm">{getLocation(selectedInfraction)}</span>
                                </div>
                                {details.latitude && details.longitude && (
                                    <p className="text-xs text-slate-500 mt-1 ml-5">
                                        Coordenadas: {Number(details.latitude).toFixed(6)}, {Number(details.longitude).toFixed(6)}
                                    </p>
                                )}
                            </div>

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
                                                {details.maxSpeedKmh || 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Exceso</p>
                                            <p className="text-xl font-bold text-amber-400">
                                                {details.speed && details.maxSpeedKmh
                                                    ? `+${(Number(details.speed) - Number(details.maxSpeedKmh)).toFixed(0)}`
                                                    : 'N/A'
                                                } <span className="text-sm">km/h</span>
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
