import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, Plus, Search, ExternalLink } from 'lucide-react';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data } = await api.get('/tenants'); // Asumiendo que este endpoint existe para ADMIN
            setTenants(data);
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
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Clientes (Tenants)</h1>
                    <p className="text-slate-400">Administración de empresas y accesos al sistema</p>
                </div>
                <button className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-900/20">
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Empresa</th>
                            <th className="px-6 py-4 font-medium">Slug / ID</th>
                            <th className="px-6 py-4 font-medium">API Key</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {tenants.map((t: any) => (
                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{t.name}</div>
                                            <div className="text-xs text-slate-500">Registrado el {new Date(t.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-mono text-sm">{t.slug}</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                                        {t.apiKey.substring(0, 8)}...
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {t.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-white transition-colors">
                                        <ExternalLink size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No hay clientes registrados aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tenants;
