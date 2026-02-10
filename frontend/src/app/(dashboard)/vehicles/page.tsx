'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Truck, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
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
}

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState({
        licensePlate: '',
        name: '',
        model: '',
        traccarDeviceId: '',
        active: true
    });

    useEffect(() => {
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
                active: vehicle.active || true
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                licensePlate: '',
                name: '',
                model: '',
                traccarDeviceId: '',
                active: true
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
            if (editingVehicle) {
                // Update
                await api.put(`/vehicles/${editingVehicle.id}`, {
                    plate: formData.licensePlate,
                    traccarDeviceId: formData.traccarDeviceId || null
                });
            } else {
                // Create
                await api.post('/vehicles', {
                    plate: formData.licensePlate,
                    traccarDeviceId: formData.traccarDeviceId || null
                });
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

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Vehículos</h1>
                    <p className="text-slate-400">Control de flota y asignación de rutas</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={20} />
                    Agregar Vehículo
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Placa</th>
                            <th className="px-6 py-4 font-medium">Device ID</th>
                            <th className="px-6 py-4 font-medium">Ruta</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {vehicles.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
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
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {v.traccarDeviceId || 'No asignado'}
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
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(v)}
                                        className="text-primary-400 hover:text-primary-300 text-sm font-medium inline-flex items-center gap-1"
                                    >
                                        <Edit size={14} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="text-red-400 hover:text-red-300 text-sm font-medium inline-flex items-center gap-1"
                                    >
                                        <Trash2 size={14} />
                                        Eliminar
                                    </button>
                                </td>
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
