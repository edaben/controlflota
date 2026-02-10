import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Plus, Shield, Mail } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                    <p className="text-slate-400">Control de accesos y permisos según roles</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
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
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map((u: any) => (
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
                                    {u.tenant?.name || 'N/A (Global)'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'} inline-block mr-2`}></div>
                                    <span className="text-sm text-slate-300">{u.active ? 'Activo' : 'Baja'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">Editar</button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No hay usuarios configurados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
