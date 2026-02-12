'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Mail, Phone, Shield, Save, Camera, CreditCard } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatarUrl: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data);
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                avatarUrl: data.avatarUrl || ''
            });

            // Update localStorage user data if needed
            const localUser = localStorage.getItem('user');
            if (localUser) {
                const parsed = JSON.parse(localUser);
                localStorage.setItem('user', JSON.stringify({ ...parsed, ...data }));
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put('/auth/profile', formData);
            setUser(data);

            // Sync with localStorage
            const localUser = localStorage.getItem('user');
            if (localUser) {
                const parsed = JSON.parse(localUser);
                localStorage.setItem('user', JSON.stringify({ ...parsed, ...data }));
            }

            alert('Perfil actualizado correctamente');
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Left Column: Avatar & Role Info */}
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                        <div className="relative inline-block mx-auto">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt="Avatar"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 ring-4 ring-emerald-500/20"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-emerald-500/10 border-4 border-slate-800 ring-4 ring-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <User size={64} />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white shadow-lg border-2 border-slate-900">
                                <Camera size={16} />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name || user.email.split('@')[0]}</h2>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-2 rounded-xl text-sm font-bold border border-amber-400/20">
                                <Shield size={16} />
                                {user.role === 'SUPER_ADMIN' ? 'Super Administrador' :
                                    user.role === 'CLIENT_ADMIN' ? 'Admin de Cliente' : 'Usuario'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Información de Empresa</h3>
                        <div className="flex items-center gap-3 text-slate-300">
                            <CreditCard size={18} className="text-emerald-500" />
                            <span>{user.tenantName || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Information Form */}
                <form onSubmit={handleSave} className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                    <h1 className="text-2xl font-bold text-white mb-6">Mi Perfil</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <User size={14} /> Nombre Completo
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Phone size={14} /> Teléfono
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                placeholder="Ej: +593 999 999 999"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Mail size={14} /> Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                        />
                        <p className="text-[10px] text-slate-500 italic">El correo no puede ser modificado por el usuario.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Camera size={14} /> URL del Avatar
                        </label>
                        <input
                            type="text"
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium font-mono text-sm"
                            placeholder="https://ejemplo.com/mifoto.jpg"
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 ${saving ? 'opacity-50' : ''}`}
                        >
                            <Save size={20} />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Permissions Section (Read Only) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-amber-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Mis Permisos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {user.role === 'SUPER_ADMIN' ? (
                        <div className="col-span-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-emerald-400 font-bold text-center">
                            💎 Acceso Total - Todos los permisos del sistema están activos.
                        </div>
                    ) : (
                        user.permissions?.map((perm: string) => (
                            <div key={perm} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-sm text-slate-300 font-medium">{perm}</span>
                            </div>
                        ))
                    )}
                    {(!user.permissions || user.permissions.length === 0) && user.role !== 'SUPER_ADMIN' && (
                        <p className="col-span-3 text-slate-500 text-center py-4">No tienes permisos específicos asignados (Usando valores por defecto del rol).</p>
                    )}
                </div>
            </div>
        </div>
    );
}
