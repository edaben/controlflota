'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Truck, Plus, MapPin, Edit, Trash2, CheckSquare, Square, Eye, ExternalLink, Copy } from 'lucide-react';
import Modal from '@/components/Modal';

interface Vehicle {
    id: string;
    name?: string;
    plate: string;
    model?: string;
    traccarDeviceId?: number;
    routeId?: string;
    active?: boolean;
    route?: { name: string };
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    ownerToken?: string;
}

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        licensePlate: '',
        name: '',
        model: '',
        traccarDeviceId: '',
        active: true,
        ownerName: '',
        ownerEmail: '',
        ownerPhone: ''
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
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vehicle?: Vehicle) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({
                licensePlate: vehicle.plate || '',
                name: vehicle.name || '',
                model: vehicle.model || '',
                traccarDeviceId: vehicle.traccarDeviceId?.toString() || '',
                active: vehicle.active || true,
                ownerName: vehicle.ownerName || '',
                ownerEmail: vehicle.ownerEmail || '',
                ownerPhone: vehicle.ownerPhone || ''
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                licensePlate: '',
                name: '',
                model: '',
                traccarDeviceId: '',
                active: true,
                ownerName: '',
                ownerEmail: '',
                ownerPhone: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVehicle(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                plate: formData.licensePlate,
                traccarDeviceId: formData.traccarDeviceId || null,
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                ownerPhone: formData.ownerPhone
            };

            if (editingVehicle) {
                // Update
                await api.put(`/vehicles/${editingVehicle.id}`, payload);
            } else {
                // Create
                await api.post('/vehicles', payload);
            }
            handleCloseModal();
            fetchVehicles();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al guardar el vehículo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;
        try {
            await api.delete(`/vehicles/${id}`);
            fetchVehicles();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el vehículo');
        }
    };

    const handleToggleSelectAll = () => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        if (selectedIds.length === vehicles.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(vehicles.map(v => v.id));
        }
    };

    const handleToggleSelect = (id: string) => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar los ${selectedIds.length} vehículos seleccionados? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.post('/vehicles/bulk-delete', { ids: selectedIds });
            setVehicles(prev => prev.filter(v => !selectedIds.includes(v.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Error deleting vehicles:', error);
            alert('Error al eliminar los vehículos seleccionados.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Vehículos</h1>
                    <p className="text-slate-400">Control de flota y asignación de rutas</p>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && hasPermission(user, PERMISSIONS.BULK_DELETE) && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                            <Trash2 size={20} className={isDeleting ? 'animate-pulse' : ''} />
                            Eliminar ({selectedIds.length})
                        </button>
                    )}
                    {hasPermission(user, PERMISSIONS.MANAGE_VEHICLES) && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Plus size={20} />
                            Agregar Vehículo
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium w-10 text-center">
                                <button
                                    onClick={handleToggleSelectAll}
                                    disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                    className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    {selectedIds.length === vehicles.length && vehicles.length > 0 ? (
                                        <CheckSquare size={18} className="text-primary-400" />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Placa</th>
                            <th className="px-6 py-4 font-medium">Ruta</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {vehicles.map((v) => (
                            <tr
                                key={v.id}
                                className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(v.id) ? 'bg-primary-500/5' : ''}`}
                            >
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleToggleSelect(v.id)}
                                        disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                        className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        {selectedIds.includes(v.id) ? (
                                            <CheckSquare size={18} className="text-primary-400" />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{v.name || 'Sin nombre'}</div>
                                            <div className="text-xs text-slate-500">{v.model || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-300 font-mono text-sm">{v.plate || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <MapPin size={14} className="text-blue-400" />
                                        <span className="text-sm">{v.route?.name || 'Sin ruta'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`w-2 h-2 rounded-full ${v.active ? 'bg-emerald-500' : 'bg-red-500'} inline-block mr-2`}></div>
                                    <span className="text-sm text-slate-300">{v.active ? 'Activo' : 'Inactivo'}</span>
                                </td>
                                {hasPermission(user, PERMISSIONS.MANAGE_VEHICLES) && (
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleOpenModal(v)}
                                            className="bg-slate-800 hover:bg-slate-700 text-primary-400 px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 border border-slate-700 transition-all"
                                        >
                                            <Eye size={16} />
                                            Ver detalles
                                        </button>
                                        <button
                                            onClick={() => handleDelete(v.id)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium inline-flex items-center gap-1"
                                        >
                                            <Trash2 size={14} />
                                            Eliminar
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {vehicles.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No hay vehículos configurados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Placa <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.licensePlate}
                            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            placeholder="ABC-1234"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Device ID de Traccar
                        </label>
                        <input
                            type="text"
                            value={formData.traccarDeviceId}
                            onChange={(e) => setFormData({ ...formData, traccarDeviceId: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            placeholder="123456"
                        />
                        <p className="text-xs text-slate-500 mt-1">ID del dispositivo en Traccar</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información del Propietario</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre del Dueño
                                </label>
                                <input
                                    type="text"
                                    value={formData.ownerName}
                                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.ownerEmail}
                                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        placeholder="juan@ejemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        WhatsApp / Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ownerPhone}
                                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        placeholder="+593 99 999 9999"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {editingVehicle?.ownerToken && (
                        <div className="bg-primary-500/10 border border-primary-500/20 p-5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary-400">
                                    <ExternalLink size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Acceso Directo (Magic Link)</span>
                                </div>
                                <span className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVO</span>
                            </div>

                            <p className="text-sm text-slate-400 leading-relaxed">
                                Este enlace permite al propietario ver la ubicación y datos del vehículo sin necesidad de usuario ni contraseña.
                            </p>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/owner/${editingVehicle.ownerToken}`}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/owner/${editingVehicle.ownerToken}`);
                                        alert('Link copiado al portapapeles');
                                    }}
                                    className="bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-primary-900/40"
                                    title="Copiar Link"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                        >
                            {editingVehicle ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
