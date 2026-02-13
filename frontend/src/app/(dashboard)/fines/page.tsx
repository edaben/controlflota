'use client'

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { FileText, DollarSign, Calendar, Car, Send, AlertTriangle, Gauge, Clock, MapPin, Info, Download, Eye, X, Trash2, CheckSquare, Square } from 'lucide-react';
import Modal from '@/components/Modal';

import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/utils/permissions';

export default function FinesPage() {
    const [fines, setFines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedFine, setSelectedFine] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleStatusChange = async (fineId: string, newStatus: string) => {
        try {
            // Optimistic update
            setFines(prev => prev.map((f: any) =>
                f.id === fineId ? { ...f, status: newStatus } : f
            ));

            await api.put(`/fines/${fineId}`, { status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            fetchFines(); // Revert on error
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

    const handleToggleSelectAll = () => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        if (selectedIds.length === fines.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(fines.map((f: any) => f.id));
        }
    };

    const handleToggleSelect = (id: string) => {
        if (!hasPermission(user, PERMISSIONS.BULK_DELETE)) return;
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar las ${selectedIds.length} multas seleccionadas? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.post('/fines/bulk-delete', { ids: selectedIds });
            setFines(prev => prev.filter((f: any) => !selectedIds.includes(f.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Error deleting fines:', error);
            alert('Error al eliminar las multas seleccionadas.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkStatusChange = async (status: string) => {
        if (!confirm(`¿Estás seguro de mover las ${selectedIds.length} multas seleccionadas a estado '${status}'?`)) {
            return;
        }

        try {
            await Promise.all(selectedIds.map(id => api.put(`/fines/${id}`, { status })));
            setFines(prev => prev.map((f: any) =>
                selectedIds.includes(f.id) ? { ...f, status } : f
            ));
            setSelectedIds([]);
        } catch (error) {
            console.error('Error updating bulk status:', error);
            alert('Error al actualizar el estado de las multas.');
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
        const underReview = fines
            .filter((f: any) => f.status === 'UNDER_REVIEW')
            .reduce((sum: number, f: any) => sum + Number(f.amountUsd || 0), 0);
        const total = fines.reduce((sum: number, f: any) => sum + Number(f.amountUsd || 0), 0);
        return { pending, paid, underReview, total, count: fines.length };
    }, [fines]);

    const getStatusSelector = (fine: any) => {
        const colors: any = {
            'UNPAID': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'PAID': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'OVERDUE': 'bg-red-500/20 text-red-400 border-red-500/30',
            'CANCELLED': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            'UNDER_REVIEW': 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };

        return (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <select
                    value={fine.status}
                    onChange={(e) => handleStatusChange(fine.id, e.target.value)}
                    className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:ring-primary-500 ${colors[fine.status] || colors.PENDING}`}
                >
                    <option value="UNPAID" className="bg-slate-800 text-yellow-400">Pendiente</option>
                    <option value="PAID" className="bg-slate-800 text-blue-400">Pagada</option>
                    <option value="UNDER_REVIEW" className="bg-slate-800 text-amber-400">En Revisión</option>
                    <option value="CANCELLED" className="bg-slate-800 text-slate-400">Cancelada</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string) => { // Keep just in case needed as fallback
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
        const address = details.address || details.location;
        const zone = details.zoneName || details.geofenceName || details.stopName;

        // If we have a real address, prioritize it and omit the zone if it's "test" or redundant
        if (address) {
            if (!zone || zone.toLowerCase() === 'test' || zone === address) {
                return address;
            }
            return `${zone}: ${address}`;
        }

        return zone || (details.latitude && details.longitude ? `${Number(details.latitude).toFixed(4)}, ${Number(details.longitude).toFixed(4)}` : 'Sin ubicación');
    };

    const handleDownloadPDF = (fine: any) => {
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
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Multas</h1>
                    <p className="text-slate-400">Gestión de sanciones económicas generadas</p>
                </div>
                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedIds.some(id => fines.find(f => f.id === id)?.status === 'PAID') && (
                            <button
                                onClick={() => handleBulkStatusChange('UNDER_REVIEW')}
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-amber-500/20"
                            >
                                <Info size={20} />
                                <span className="hidden sm:inline">Poner en Revisión</span>
                                <span className="sm:hidden">Revisión</span>
                            </button>
                        )}
                        <button
                            onClick={handleSendReminders}
                            disabled={sending}
                            className={`flex-1 lg:flex-none justify-center bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700 ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Send size={20} className={sending ? 'animate-pulse' : ''} />
                            <span>{sending ? 'Enviando...' : 'Enviar'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Info className="text-amber-400" size={24} />
                        </div>
                        <span className="text-xs text-amber-400/60 font-medium">REVISIÓN</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.underReview.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">En Revisión</div>
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

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium w-10">
                                <button
                                    onClick={handleToggleSelectAll}
                                    disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                    className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    {selectedIds.length === fines.length && fines.length > 0 ? (
                                        <CheckSquare size={18} className="text-primary-400" />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 font-medium text-sm">Fecha</th>
                            <th className="px-6 py-4 font-medium">Vehículo</th>
                            <th className="px-6 py-4 font-medium">Razón</th>
                            <th className="px-6 py-4 font-medium">Monto</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {fines.map((fine: any) => (
                            <tr
                                key={fine.id}
                                className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(fine.id) ? 'bg-primary-500/5' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleSelect(fine.id)}
                                        disabled={!hasPermission(user, PERMISSIONS.BULK_DELETE)}
                                        className={`text-slate-500 hover:text-primary-400 transition-colors ${!hasPermission(user, PERMISSIONS.BULK_DELETE) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        {selectedIds.includes(fine.id) ? (
                                            <CheckSquare size={18} className="text-primary-400" />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
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
                                    {getStatusSelector(fine)}
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
                                        onClick={() => handleDownloadPDF(fine)}
                                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium hover:underline transition-colors"
                                    >
                                        <Download size={16} className="inline mr-1" />
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {fines.map((fine: any) => (
                    <div
                        key={fine.id}
                        className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 ${selectedIds.includes(fine.id) ? 'ring-2 ring-primary-500/50' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleToggleSelect(fine.id)}
                                    className="text-slate-500 hover:text-primary-400 transition-colors"
                                >
                                    {selectedIds.includes(fine.id) ? (
                                        <CheckSquare size={20} className="text-primary-400" />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </button>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Car size={16} className="text-emerald-400" />
                                        <span className="text-sm font-bold text-white">{getVehicleName(fine)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <Calendar size={12} className="text-blue-400" />
                                        <span>{formatDate(fine.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-emerald-400 mb-1">
                                    ${getAmount(fine)}
                                </div>
                                {getStatusSelector(fine)}
                            </div>
                        </div>

                        <div className="py-3 border-y border-slate-800/50">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Motivo / Infracción</p>
                            <div className="flex items-center gap-2">
                                {getInfractionTypeIcon(fine.infraction?.type)}
                                <span className="text-sm text-slate-300">{getInfractionReason(fine)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedFine(fine)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-primary-400 rounded-xl font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
                            >
                                <Eye size={18} />
                                Detalles
                            </button>
                            <button
                                onClick={() => handleDownloadPDF(fine)}
                                className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold transition-all border border-emerald-500/20"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {fines.length === 0 && !loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                    No hay multas registradas.
                </div>
            )}

            {/* Fine Detail Modal */}
            <Modal isOpen={!!selectedFine} onClose={() => setSelectedFine(null)} title="Detalle de Multa">
                {selectedFine && (() => {
                    const details = parseDetails(selectedFine);
                    return (
                        <div className="space-y-5">
                            {/* Header */}

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
                                    {getStatusSelector(selectedFine)}
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
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p>
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="text-red-400 mt-1 shrink-0" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{getLocation(selectedFine)}</p>
                                                {(() => {
                                                    const details = parseDetails(selectedFine);
                                                    if (details.reference) {
                                                        return <p className="text-xs text-slate-400 mt-1 italic">Ref: {details.reference}</p>
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    {(details.latitude && details.longitude) && (
                                        <a
                                            href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
                                        >
                                            Ver en Mapa ↗
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Speed details for overspeed */}
                            {(selectedFine.infraction?.type === 'OVERSPEED') && (
                                <div className="bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                                    <p className="text-xs text-red-400 uppercase tracking-wider mb-2">Detalles de Velocidad</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Detectada</p>
                                            <p className="text-xl font-bold text-red-400">
                                                {details.speed || details.speedKmh || 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Máxima</p>
                                            <p className="text-xl font-bold text-emerald-400">
                                                {details.maxSpeedKmh || details.maxAllowed || 'N/A'} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Exceso</p>
                                            <p className="text-xl font-bold text-amber-400">
                                                {details.excessKmh !== undefined
                                                    ? `+${details.excessKmh}`
                                                    : (details.speed && details.maxSpeedKmh
                                                        ? `+${(Number(details.speed) - Number(details.maxSpeedKmh)).toFixed(0)}`
                                                        : 'N/A')} <span className="text-sm">km/h</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Infraction Details */}
                            {selectedFine.infraction && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha de Infracción</p>
                                        <span className="text-white text-sm">
                                            {formatDate(selectedFine.infraction.detectedAt || selectedFine.infraction.createdAt)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dueño/Responsable</p>
                                        <span className="text-white text-sm">
                                            {details.object_owner || details.owner || 'N/A'}
                                        </span>
                                    </div>
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
