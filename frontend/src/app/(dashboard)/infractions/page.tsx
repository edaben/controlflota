'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Calendar, Car, MapPin, Filter, X } from 'lucide-react';
import Modal from '@/components/Modal';

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function InfractionsPage() {
    const [infractions, setInfractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [vehicles, setVehicles] = useState([]);
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
            'SPEED_VIOLATION': 'Exceso de Velocidad',
            'STOP_VIOLATION': 'Violación de Parada',
            'ROUTE_DEVIATION': 'Desviación de Ruta',
            'GEOFENCE_EXIT': 'Salida de Geofence'
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PROCESSED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'DISMISSED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: any = {
            'PENDING': 'Pendiente',
            'PROCESSED': 'Procesada',
            'DISMISSED': 'Descartada'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.PENDING}`}>
                {labels[status] || status}
            </span>
        );
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
                                            {new Date(inf.timestamp).toLocaleString('es-EC')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-slate-400" />
                                        <span className="text-white font-medium">{inf.vehicle?.licensePlate || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-amber-400" />
                                        <span className="text-sm text-slate-300">{getInfractionTypeLabel(inf.type)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin size={14} />
                                        <span>{inf.location || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(inf.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">Ver Detalles</button>
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
                            <option value="PROCESSED">Procesada</option>
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
