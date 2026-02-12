'use client'

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { FileText, DollarSign, Calendar, Car, Send, AlertTriangle, Gauge, Clock, MapPin, Info, Download, Eye, X } from 'lucide-react';
import Modal from '@/components/Modal';

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function FinesPage() {
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedFine, setSelectedFine] = useState<any>(null);

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

    // Calculate real stats from data
    const stats = useMemo(() => {
        const pending = fines
            .filter((f: any) => f.status === 'UNPAID' || f.status === 'PENDING')
            .reduce((sum: number, f: any) => sum + Number(f.amountUsd || 0), 0);
        const paid = fines
            .filter((f: any) => f.status === 'PAID')
            .reduce((sum: number, f: any) => sum + Number(f.amountUsd || 0), 0);
        const total = fines.reduce((sum: number, f: any) => sum + Number(f.amountUsd || 0), 0);
        return { pending, paid, total, count: fines.length };
    }, [fines]);

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'UNPAID': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PAID': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'OVERDUE': 'bg-red-500/20 text-red-400 border-red-500/30',
            'CANCELLED': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: any = {
            'UNPAID': 'Pendiente',
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

    const getInfractionTypeLabel = (type: string) => {
        const types: any = {
            'OVERSPEED': 'Exceso de Velocidad',
            'SPEED_VIOLATION': 'Exceso de Velocidad',
            'TIME_SEGMENT': 'Tiempo de Segmento',
            'DWELL_TIME': 'Tiempo en Parada',
            'STOP_VIOLATION': 'Violación de Parada',
            'ROUTE_DEVIATION': 'Desviación de Ruta',
        };
        return types[type] || type || 'Sin tipo';
    };

    const getInfractionTypeIcon = (type: string) => {
        switch (type) {
            case 'OVERSPEED':
            case 'SPEED_VIOLATION':
                return <Gauge size={14} className="text-red-400" />;
            case 'TIME_SEGMENT':
            case 'DWELL_TIME':
                return <Clock size={14} className="text-orange-400" />;
            default:
                return <AlertTriangle size={14} className="text-amber-400" />;
        }
    };

    // Get vehicle name
    const getVehicleName = (fine: any): string => {
        const v = fine.infraction?.vehicle;
        if (v) return v.plate || v.internalCode || v.name || 'Sin placa';
        return 'N/A';
    };

    // Get infraction reason
    const getInfractionReason = (fine: any): string => {
        return getInfractionTypeLabel(fine.infraction?.type);
    };

    // Format date safely
    const formatDate = (dateStr: any): string => {
        if (!dateStr) return 'Sin fecha';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Sin fecha';
            return d.toLocaleString('es-EC', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false
            });
        } catch {
            return 'Sin fecha';
        }
    };

    // Parse infraction details
    const parseDetails = (fine: any): any => {
        try {
            const d = fine.infraction?.details;
            if (!d) return {};
            return typeof d === 'string' ? JSON.parse(d) : d;
        } catch {
            return {};
        }
    };

    // Get the amount - try amountUsd first, then amount
    const getAmount = (fine: any): string => {
        const val = fine.amountUsd ?? fine.amount ?? 0;
        return Number(val).toFixed(2);
    };

    // Get location from infraction details
    const getLocation = (fine: any): string => {
        const details = parseDetails(fine);
        return details.geofenceName || details.zoneName || details.stopName || details.location || details.address || 'Sin ubicación';
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Multas</h1>
                    <p className="text-slate-400">Control de multas generadas y pagos</p>
                </div>
                {hasPermission(user, PERMISSIONS.MANAGE_FINES) && (
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
                )}
            </div>

            {/* Stats Cards - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <DollarSign className="text-yellow-400" size={24} />
                        </div>
                        <span className="text-xs text-yellow-400/60 font-medium">PENDIENTES</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.pending.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Multas Pendientes</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="text-emerald-400" size={24} />
                        </div>
                        <span className="text-xs text-emerald-400/60 font-medium">PAGADAS</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.paid.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Multas Pagadas</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <FileText className="text-blue-400" size={24} />
                        </div>
                        <span className="text-xs text-blue-400/60 font-medium">TOTAL</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.total.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">{stats.count} Multas en Total</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">N° Multa</th>
                            <th className="px-6 py-4 font-medium">Fecha</th>
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Razón</th>
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
                                            {formatDate(fine.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-slate-400" />
                                        <span className="text-white font-medium">{getVehicleName(fine)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getInfractionTypeIcon(fine.infraction?.type)}
                                        <span className="text-sm text-slate-300">{getInfractionReason(fine)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                        <DollarSign size={16} />
                                        <span>{getAmount(fine)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(fine.status)}
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button
                                        onClick={() => setSelectedFine(fine)}
                                        className="text-primary-400 hover:text-primary-300 text-sm font-medium hover:underline transition-colors"
                                    >
                                        <Eye size={16} className="inline mr-1" />
                                        Ver
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Generate a simple print/PDF view
                                            const details = parseDetails(fine);
                                            const w = window.open('', '_blank', 'width=800,height=600');
                                            if (w) {
                                                w.document.write(`
                                                    <html><head><title>Multa ${fine.id.substring(0, 8)}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                                                        h1 { color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px; }
                                                        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                                                        .field { background: #f8f9fa; padding: 12px; border-radius: 8px; }
                                                        .field label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; text-transform: uppercase; }
                                                        .field span { font-size: 16px; font-weight: bold; }
                                                        .amount { font-size: 32px; color: #e94560; font-weight: bold; text-align: center; margin: 30px 0; }
                                                        .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
                                                        @media print { body { padding: 20px; } }
                                                    </style></head><body>
                                                    <h1>🚌 Control Bus - Multa de Tránsito</h1>
                                                    <div class="info">
                                                        <div class="field"><label>N° Multa</label><span>F-${fine.id.substring(0, 8)}</span></div>
                                                        <div class="field"><label>Fecha</label><span>${formatDate(fine.createdAt)}</span></div>
                                                        <div class="field"><label>Vehículo</label><span>${getVehicleName(fine)}</span></div>
                                                        <div class="field"><label>Razón</label><span>${getInfractionReason(fine)}</span></div>
                                                        <div class="field"><label>Estado</label><span>${fine.status}</span></div>
                                                        <div class="field"><label>Ubicación</label><span>${getLocation(fine)}</span></div>
                                                        ${details.speed ? `<div class="field"><label>Velocidad Detectada</label><span>${details.speed} km/h</span></div>` : ''}
                                                        ${details.maxSpeedKmh ? `<div class="field"><label>Velocidad Máxima</label><span>${details.maxSpeedKmh} km/h</span></div>` : ''}
                                                    </div>
                                                    <div class="amount">Monto: $${getAmount(fine)} USD</div>
                                                    <div class="footer">
                                                        <p>Documento generado por Control Bus - Sistema de Infracciones</p>
                                                        <p>Fecha de generación: ${new Date().toLocaleString('es-EC')}</p>
                                                    </div>
                                                    <script>window.print();</script>
                                                    </body></html>
                                                `);
                                                w.document.close();
                                            }
                                        }}
                                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium hover:underline transition-colors"
                                    >
                                        <Download size={16} className="inline mr-1" />
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {fines.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    No hay multas registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Fine Detail Modal */}
            <Modal isOpen={!!selectedFine} onClose={() => setSelectedFine(null)} title="Detalle de Multa">
                {selectedFine && (() => {
                    const details = parseDetails(selectedFine);
                    return (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">N° Multa</p>
                                <p className="text-xl font-mono font-bold text-white">F-{selectedFine.id.substring(0, 8)}</p>
                            </div>

                            {/* Amount */}
                            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-6 rounded-xl border border-red-800/30 text-center">
                                <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Monto de la Multa</p>
                                <p className="text-4xl font-bold text-white">${getAmount(selectedFine)} <span className="text-lg text-slate-400">USD</span></p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span className="text-white text-sm">{formatDate(selectedFine.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                                    {getStatusBadge(selectedFine.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehículo</p>
                                    <div className="flex items-center gap-2">
                                        <Car size={14} className="text-emerald-400" />
                                        <span className="text-white font-medium">{getVehicleName(selectedFine)}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Razón</p>
                                    <div className="flex items-center gap-2">
                                        {getInfractionTypeIcon(selectedFine.infraction?.type)}
                                        <span className="text-white text-sm">{getInfractionReason(selectedFine)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-red-400" />
                                    <span className="text-white text-sm">{getLocation(selectedFine)}</span>
                                </div>
                            </div>

                            {/* Speed details for overspeed */}
                            {(selectedFine.infraction?.type === 'OVERSPEED') && (
                                <div className="bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                                    <p className="text-xs text-red-400 uppercase tracking-wider mb-2">Detalles de Velocidad</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Detectada</p>
                                            <p className="text-xl font-bold text-red-400">{details.speed || 'N/A'} <span className="text-sm">km/h</span></p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Máxima</p>
                                            <p className="text-xl font-bold text-emerald-400">{details.maxSpeedKmh || 'N/A'} <span className="text-sm">km/h</span></p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Exceso</p>
                                            <p className="text-xl font-bold text-amber-400">
                                                {details.speed && details.maxSpeedKmh ? `+${(Number(details.speed) - Number(details.maxSpeedKmh)).toFixed(0)}` : 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Infraction Details */}
                            {selectedFine.infraction && (
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha de Infracción</p>
                                    <span className="text-white text-sm">
                                        {formatDate(selectedFine.infraction.detectedAt || selectedFine.infraction.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Raw details */}
                            {Object.keys(details).length > 0 && (
                                <details className="group">
                                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1">
                                        <Info size={12} />
                                        Ver datos técnicos
                                    </summary>
                                    <pre className="mt-2 bg-slate-950 p-3 rounded-lg text-xs text-slate-400 overflow-x-auto max-h-48 overflow-y-auto border border-slate-800">
                                        {JSON.stringify(details, null, 2)}
                                    </pre>
                                </details>
                            )}

                            <p className="text-xs text-slate-600 text-center">ID: {selectedFine.id}</p>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
