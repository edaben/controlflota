'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, DollarSign, Calendar, Car, Send } from 'lucide-react';

export default function FinesPage() {
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchFines();
    }, []);

    const fetchFines = async () => {
        try {
            const { data } = await api.get('/fines');
            setFines(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminders = async () => {
        if (!confirm('¿Estás seguro de que deseas enviar recordatorios para todas las multas pendientes?')) {
            return;
        }

        setSending(true);
        try {
            const { data } = await api.post('/fines/send-reminders');
            alert(data.message);
        } catch (err) {
            console.error(err);
            alert('Error al enviar recordatorios.');
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PAID': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'OVERDUE': 'bg-red-500/20 text-red-400 border-red-500/30',
            'CANCELLED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: any = {
            'PENDING': 'Pendiente',
            'PAID': 'Pagada',
            'OVERDUE': 'Vencida',
            'CANCELLED': 'Cancelada'
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
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Multas</h1>
                    <p className="text-slate-400">Control de multas generadas y pagos</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSendReminders}
                        disabled={sending}
                        className={`bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700 ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Send size={20} className={sending ? 'animate-pulse' : ''} />
                        {sending ? 'Enviando...' : 'Enviar Recordatorios'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <DollarSign className="text-yellow-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">$1,250.00</div>
                    <div className="text-sm text-slate-400">Multas Pendientes</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">$3,450.00</div>
                    <div className="text-sm text-slate-400">Multas Pagadas</div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <DollarSign className="text-red-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">$850.00</div>
                    <div className="text-sm text-slate-400">Multas Vencidas</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">N° Multa</th>
                            <th className="px-6 py-4 font-medium">Fecha</th>
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Monto</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {fines.map((fine: any) => (
                            <tr key={fine.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" />
                                        <span className="text-white font-mono text-sm">{fine.fineNumber || `F-${fine.id.substring(0, 8)}`}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span className="text-sm">
                                            {new Date(fine.createdAt).toLocaleDateString('es-EC')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-slate-400" />
                                        <span className="text-white font-medium">{fine.infraction?.vehicle?.licensePlate || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                        <DollarSign size={16} />
                                        <span>{fine.amount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(fine.status)}
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">Ver</button>
                                    <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">PDF</button>
                                </td>
                            </tr>
                        ))}
                        {fines.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No hay multas registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
