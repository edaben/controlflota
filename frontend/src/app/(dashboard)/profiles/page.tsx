'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Shield, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { PERMISSIONS, PERMISSION_LABELS, Permission } from '@/constants/permissions';

interface ProfileData {
    id: string;
    name: string;
    permissions: string[];
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export default function ProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<ProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ProfileData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        permissions: [] as string[]
    });

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const { data } = await api.get('/profiles');
            setProfiles(data);
        } catch (err: any) {
            console.error(err);
            alert(`Error al cargar perfiles: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (profile?: ProfileData) => {
        if (profile) {
            setEditingProfile(profile);
            setFormData({
                name: profile.name,
                permissions: profile.permissions || []
            });
        } else {
            setEditingProfile(null);
            setFormData({
                name: '',
                permissions: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProfile(null);
        setFormData({
            name: '',
            permissions: []
        });
    };

    const togglePermission = (perm: string) => {
        setFormData(prev => {
            const has = prev.permissions.includes(perm);
            if (has) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
            } else {
                return { ...prev, permissions: [...prev.permissions, perm] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProfile) {
                await api.put(`/profiles/${editingProfile.id}`, formData);
            } else {
                await api.post('/profiles', formData);
            }
            handleCloseModal();
            fetchProfiles();
            alert('Perfil guardado exitosamente');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
            alert(`Error al guardar: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este perfil? No debe estar asignado a ningún usuario.')) return;
        try {
            await api.delete(`/profiles/${id}`);
            fetchProfiles();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || 'Error al eliminar el perfil';
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Perfiles de Permisos</h1>
                    <p className="text-slate-400">Crea conjuntos de permisos reutilizables para tus usuarios</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={20} />
                    Nuevo Perfil
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <Shield size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(p)}
                                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {p.permissions.length} permisos asignados
                        </div>

                        <div className="flex flex-wrap gap-1.5 line-clamp-2 overflow-hidden max-h-16">
                            {p.permissions.slice(0, 5).map(perm => (
                                <span key={perm} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium border border-slate-700">
                                    {PERMISSION_LABELS[perm as Permission]?.label || perm}
                                </span>
                            ))}
                            {p.permissions.length > 5 && (
                                <span className="text-[10px] text-slate-500 py-0.5">+{p.permissions.length - 5} más...</span>
                            )}
                        </div>
                    </div>
                ))}

                {profiles.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                        No has creado ningún perfil todavía. Comienza creando uno para organizar tus permisos.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre del Perfil
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ej: Operador de Tráfico, Auditor..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-4">
                            Seleccionar Permisos
                        </label>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {Object.entries(
                                Object.values(PERMISSIONS).reduce((acc, perm) => {
                                    const cat = PERMISSION_LABELS[perm as Permission]?.category || 'Otros';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(perm as Permission);
                                    return acc;
                                }, {} as Record<string, Permission[]>)
                            ).map(([category, perms]) => (
                                <div key={category} className="mb-6 last:mb-0">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {perms.map(perm => (
                                            <label key={perm} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm)}
                                                    onChange={() => togglePermission(perm)}
                                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 transition-all"
                                                />
                                                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                                    {PERMISSION_LABELS[perm]?.label || perm}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                            {editingProfile ? 'Actualizar Perfil' : 'Crear Perfil'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
