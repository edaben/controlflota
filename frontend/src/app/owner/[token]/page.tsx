'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
    Truck,
    AlertTriangle,
    Calendar,
    DollarSign,
    ChevronRight,
    FileText,
    Clock,
    ShieldCheck,
    RefreshCw,
    MapPin,
    ExternalLink
} from 'lucide-react';

export default function OwnerPortal() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [infractions, setInfractions] = useState<any[]>([]);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, infractionsRes] = await Promise.all([
                axios.get(`${baseUrl}/owner/${token}/summary`),
                axios.get(`${baseUrl}/owner/${token}/infractions`)
            ]);
            setSummary(summaryRes.data);
            setInfractions(infractionsRes.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'No se pudo cargar la información. Verifique que el link sea correcto.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="text-primary-500 animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-medium italic">Accediendo a su portal seguro...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="text-red-500" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Enlace no válido</h1>
                <p className="text-slate-400 mb-8 max-w-sm">{error}</p>
                <div className="text-xs text-slate-600 border-t border-slate-900 pt-6">
                    Si cree que esto es un error, por favor contacte a la administración de Control Bus.
                </div>
            </div>
        );
    }

    const { vehicle, tenant, stats } = summary;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
            {/* Header / Brand */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        <Truck className="text-primary-500" size={20} />
                        Control Bus
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{tenant.name}</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Link Seguro
                </div>
            </div>

            <main className="px-6 py-6 space-y-8 max-w-md mx-auto">
                {/* Vehicle Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Truck size={100} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Vehículo / Unidad</h2>
                        <div className="text-3xl font-black text-white tracking-tight mb-2 uppercase">{vehicle.plate}</div>
                        <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
                            <Clock size={12} className="text-primary-400" />
                            {vehicle.internalCode || 'Sin código interno'}
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Multas Pendientes</p>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-white">{stats.pendingCount}</span>
                            <AlertTriangle className="text-amber-500 mb-1" size={18} />
                        </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Total a Pagar</p>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-emerald-400">${Number(stats.pendingAmount || 0).toFixed(0)}</span>
                            <DollarSign className="text-emerald-500/50 mb-1" size={16} />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase">Dólares (USD)</p>
                    </div>
                </div>

                {/* Recent Infractions */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial Reciente</h3>
                        <button onClick={fetchData} className="text-primary-400 text-xs flex items-center gap-1 hover:text-primary-300 transition-colors">
                            <RefreshCw size={12} /> Actualizar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {infractions.length > 0 ? infractions.map((inf: any) => (
                            <div key={inf.id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${inf.type === 'OVERSPEED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {inf.type === 'OVERSPEED' ? <AlertTriangle size={24} /> : <Clock size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-white truncate">
                                            {inf.type === 'OVERSPEED' ? 'Exceso de Velocidad' : (inf.type === 'STOP_VIOLATION' ? 'Violación de Parada' : inf.type)}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                            {new Date(inf.detectedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-white font-bold">
                                            ${Number(inf.fine?.amountUsd || 0).toFixed(2)} USD
                                        </span>
                                        <span className={`px-2 py-0.5 rounded font-bold ${inf.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {inf.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-700" size={16} />
                            </div>
                        )) : (
                            <div className="bg-slate-900/40 p-10 rounded-3xl border border-dashed border-slate-800 text-center">
                                <Truck className="mx-auto text-slate-800 mb-3" size={40} />
                                <p className="text-slate-500 text-sm">No se registran infracciones recientes para esta unidad.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-primary-900/10 border border-primary-500/20 p-6 rounded-3xl text-center space-y-3">
                    <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">¿Desea descargar un consolidado?</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        Los reportes oficiales son enviados automáticamente a su correo electrónico configurado al final de cada periodo.
                    </p>
                    <button className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2">
                        <FileText size={14} /> Solicitar PDF por Correo
                    </button>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[9px] text-slate-700 uppercase tracking-widest font-bold">&copy; 2026 Control Bus - Gestión de Flotas Premium</p>
                </div>
            </main>

            {/* Bottom Nav Bar (Simulated) */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-8 py-3 flex justify-between items-center max-w-md mx-auto rounded-t-3xl">
                <div className="flex flex-col items-center gap-1 text-primary-500">
                    <RefreshCw size={20} />
                    <span className="text-[10px] font-bold">Resumen</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500">
                    <AlertTriangle size={20} />
                    <span className="text-[10px] font-bold">Multas</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500">
                    <MapPin size={20} />
                    <span className="text-[10px] font-bold">Rutas</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500">
                    <ExternalLink size={20} />
                    <span className="text-[10px] font-bold">Soporte</span>
                </div>
            </div>
        </div>
    );
}
