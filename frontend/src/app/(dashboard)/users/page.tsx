'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, Plus, Shield, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { PERMISSIONS, PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS, Permission } from '@/constants/permissions';

interface UserData {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    tenant?: { name: string };
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'CLIENT_USER',
        permissions: [] as string[]
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Si no es admin ni super, fuera
                if (user.role === 'CLIENT_USER') {
                    router.push('/dashboard');
                    return;
                }
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (err: any) {
            console.error(err);
            alert(`Error al cargar usuarios: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: UserData) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                password: '',
                role: user.role,
                permissions: user.permissions || []
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                role: 'CLIENT_USER',
                permissions: DEFAULT_ROLE_PERMISSIONS['CLIENT_USER'] || []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            role: 'CLIENT_USER',
            permissions: []
        });
    };

    const handleRoleChange = (newRole: string) => {
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || [];
        setFormData({
            ...formData,
            role: newRole,
            permissions: defaultPerms
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
            const payload = {
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions
            };

            if (editingUser) {
                const updateData: any = { ...payload };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.put(`/users/${editingUser.id}`, updateData);
            } else {
                await api.post('/users', {
                    ...payload,
                    password: formData.password
                });
            }
            handleCloseModal();
            fetchUsers();
            alert('Usuario guardado exitosamente');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
            alert(`Error al guardar: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el usuario');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                    <p className="text-slate-400">Control de accesos y permisos según roles</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={20} />
                    Crear Usuario
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Usuario</th>
                            <th className="px-6 py-4 font-medium">Rol</th>
                            <th className="px-6 py-4 font-medium">Tenant</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{u.email}</div>
                                            <div className="text-xs text-slate-500">ID: {u.id.substring(0, 8)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Shield size={14} className="text-amber-400" />
                                        <span className="text-sm">{u.role}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {u.tenant?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(u)}
                                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No hay usuarios configurados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="usuario@ejemplo.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
                        </label>
                        <input
                            type="password"
                            required={!editingUser}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Rol
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="CLIENT_USER">Usuario Cliente</option>
                            <option value="CLIENT_ADMIN">Administrador Cliente</option>
                            <option value="SUPER_ADMIN">Super Administrador</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Permisos Específicos
                        </label>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
                            {Object.entries(
                                Object.values(PERMISSIONS).reduce((acc, perm) => {
                                    const cat = PERMISSION_LABELS[perm as Permission]?.category || 'Otros';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(perm as Permission);
                                    return acc;
                                }, {} as Record<string, Permission[]>)
                            ).map(([category, perms]) => (
                                <div key={category} className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {perms.map(perm => (
                                            <label key={perm} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm)}
                                                    onChange={() => togglePermission(perm)}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/20"
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
                        <p className="text-[10px] text-slate-500 mt-2">
                            * Los permisos marcados son efectivos para este usuario. SUPER_ADMIN tiene acceso total por defecto.
                        </p>
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
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
                        >
                            {editingUser ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
