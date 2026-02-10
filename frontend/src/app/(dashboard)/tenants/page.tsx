'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Building2, Plus, Pencil, Trash2, Key } from 'lucide-react';
import Modal from '@/components/Modal';

interface TenantData {
    id: string;
    name: string;
    slug: string;
    apiKey: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        users: number;
        vehicles: number;
    };
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<TenantData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        apiKey: '',
        active: true
    });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data } = await api.get('/tenants');
            setTenants(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tenant?: TenantData) => {
        if (tenant) {
            setEditingTenant(tenant);
            setFormData({
                name: tenant.name,
                slug: tenant.slug,
                apiKey: tenant.apiKey,
                active: tenant.active
            });
        } else {
            setEditingTenant(null);
            setFormData({
                name: '',
                slug: '',
                apiKey: `api-key-${Date.now()}`,
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTenant(null);
        setFormData({
            name: '',
            slug: '',
            apiKey: '',
            active: true
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTenant) {
                await api.put(`/tenants/${editingTenant.id}`, formData);
            } else {
                await api.post('/tenants', formData);
            }
            handleCloseModal();
            fetchTenants();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al guardar el cliente');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cliente? Esto eliminará todos sus datos asociados.')) return;
        try {
            await api.delete(`/tenants/${id}`);
            fetchTenants();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el cliente');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Clientes (Tenants)</h1>
                    <p className="text-slate-400">Administración de empresas y accesos al sistema</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-900/20"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Empresa</th>
                            <th className="px-6 py-4 font-medium">Slug</th>
                            <th className="px-6 py-4 font-medium">API Key</th>
                            <th className="px-6 py-4 font-medium">Usuarios</th>
                            <th className="px-6 py-4 font-medium">Vehículos</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {tenants.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{t.name}</div>
                                            <div className="text-xs text-slate-500">ID: {t.id.substring(0, 8)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-mono text-sm">{t.slug}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Key size={14} className="text-amber-400" />
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">
                                            {t.apiKey.substring(0, 12)}...
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {t._count?.users || 0}
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {t._count?.vehicles || 0}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {t.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(t)}
                                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    No hay clientes registrados aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingTenant ? 'Editar Cliente' : 'Nuevo Cliente'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ej: Transportes ABC"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Slug (identificador único)
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                            placeholder="ej: transportes-abc"
                        />
                        <p className="text-xs text-slate-500 mt-1">Solo letras minúsculas, números y guiones</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            API Key
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                            placeholder="api-key-..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                        />
                        <label htmlFor="active" className="text-sm text-slate-300">
                            Cliente activo
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-colors"
                        >
                            {editingTenant ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
