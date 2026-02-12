'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Mail, Clock, Calendar, CheckCircle, Download, Share2, Save, Zap, AlertTriangle, FileText, DollarSign, Eye, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

export default function ConsolidatedPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Schedule configuration
    const [schedule, setSchedule] = useState({
        enabled: false,
        frequency: 'DAILY',
        sendTimeLocal: '23:59',
        recipientsEmails: '',
        includeStatus: 'CONFIRMED_ONLY'
    });

    // Period for manual generation
    const [period, setPeriod] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, scheduleRes] = await Promise.all([
                api.get('/reports/consolidated-reports'),
                api.get('/reports/schedule')
            ]);
            setReports(reportsRes.data);

            if (scheduleRes.data && scheduleRes.data.tenantId) {
                setSchedule({
                    enabled: scheduleRes.data.enabled || false,
                    frequency: scheduleRes.data.frequency || 'DAILY',
                    sendTimeLocal: scheduleRes.data.sendTimeLocal || '23:59',
                    recipientsEmails: Array.isArray(scheduleRes.data.recipientsEmails)
                        ? scheduleRes.data.recipientsEmails.join(', ')
                        : scheduleRes.data.recipientsEmails || '',
                    includeStatus: scheduleRes.data.includeStatus || 'CONFIRMED_ONLY'
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSaveSchedule = async () => {
        setSaving(true);
        try {
            await api.put('/reports/schedule', {
                ...schedule,
                recipientsEmails: schedule.recipientsEmails
            });
            showMessage('success', 'Configuración guardada exitosamente');
        } catch (err: any) {
            console.error(err);
            showMessage('error', err.response?.data?.details || 'Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data } = await api.post('/reports/generate', {
                periodStart: period.start,
                periodEnd: period.end
            });
            showMessage('success',
                data.emailSent
                    ? `Reporte generado y enviado por email exitosamente. ${data.items?.length || 0} multas consolidadas.`
                    : `Reporte generado exitosamente. ${data.items?.length || 0} multas consolidadas. Total: $${Number(data.totalUsd).toFixed(2)}`
            );
            fetchData(); // Refresh the list
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.response?.data?.details || 'Error al generar reporte';
            showMessage('error', errorMsg);
        } finally {
            setGenerating(false);
        }
    };

    const handleSendNow = async (reportId: string, event?: React.MouseEvent) => {
        if (event) event.stopPropagation();

        // Check if there are recipients
        if (!schedule.recipientsEmails) {
            if (!confirm('No hay emails configurados en la programación. ¿Deseas configurarlos primero?')) return;
            return;
        }

        if (!confirm('¿Estás seguro de enviar este reporte ahora por email a los destinatarios configurados?')) return;

        setSendingEmail(reportId);
        try {
            const { data } = await api.post(`/reports/send/${reportId}`);
            showMessage('success', data.message || 'Reporte enviado exitosamente');

            // Update local state to show sent status immediately if needed
            setReports(prev => prev.map((r: any) =>
                r.id === reportId ? { ...r, status: 'SENT', sentAt: new Date().toISOString() } : r
            ) as any);

            if (selectedReport && selectedReport.id === reportId) {
                setSelectedReport((prev: any) => ({ ...prev, status: 'SENT', sentAt: new Date().toISOString() }));
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Error al enviar email';
            showMessage('error', errorMsg);
        } finally {
            setSendingEmail(null);
        }
    };

    const formatDate = (dateStr: any): string => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch {
            return 'N/A';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'GENERATED': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'SENT': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'ERROR': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        const labels: any = {
            'GENERATED': 'Generado',
            'SENT': 'Enviado',
            'ERROR': 'Error'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.GENERATED}`}>
                {labels[status] || status}
            </span>
        );
    };

    const handlePrintReport = (report: any) => {
        const w = window.open('', '_blank', 'width=800,height=600');
        if (w) {
            w.document.write(`
                <html><head><title>Reporte Consolidado</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    h1 { color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px; }
                    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                    .field { background: #f8f9fa; padding: 12px; border-radius: 8px; }
                    .field label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; text-transform: uppercase; }
                    .field span { font-size: 16px; font-weight: bold; }
                    .amount { font-size: 32px; color: #e94560; font-weight: bold; text-align: center; margin: 30px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #1a1a2e; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
                    .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
                    @media print { body { padding: 20px; } }
                </style></head><body>
                <h1>🚌 Reporte Consolidado de Multas</h1>
                <div class="info">
                    <div class="field"><label>Periodo</label><span>${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}</span></div>
                    <div class="field"><label>Estado</label><span>${report.status}</span></div>
                    <div class="field"><label>Multas Incluidas</label><span>${report.items?.length || 0}</span></div>
                    <div class="field"><label>Fecha Generación</label><span>${formatDate(report.createdAt)}</span></div>
                </div>
                <div class="amount">Total: $${Number(report.totalUsd).toFixed(2)} USD</div>
                ${report.sentAt ? `<p style="text-align:center; color: #10b981;">📧 Enviado el ${formatDate(report.sentAt)}</p>` : ''}
                <div class="footer">
                    <p>Documento generado por Control Bus - Sistema de Infracciones</p>
                    <p>ID: ${report.id}</p>
                </div>
                <script>window.print();</script>
                </body></html>
            `);
            w.document.close();
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Reportes Consolidados</h1>
                <p className="text-slate-400">Genera y envía reportes consolidados de multas por email</p>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-red-900/30 border-red-800/50 text-red-300'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Schedule Config */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-primary-400" />
                            Programación
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">Activar Envío Automático</label>
                                <button
                                    onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transform transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Frecuencia</label>
                                <select
                                    value={schedule.frequency}
                                    onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="DAILY">Diario</option>
                                    <option value="WEEKLY">Semanal</option>
                                    <option value="MONTHLY">Mensual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Hora de Envío</label>
                                <input
                                    type="time"
                                    value={schedule.sendTimeLocal}
                                    onChange={(e) => setSchedule({ ...schedule, sendTimeLocal: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Incluir Multas</label>
                                <select
                                    value={schedule.includeStatus}
                                    onChange={(e) => setSchedule({ ...schedule, includeStatus: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="CONFIRMED_ONLY">Solo Confirmadas</option>
                                    <option value="PENDING_AND_CONFIRMED">Pendientes y Confirmadas</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    <Mail size={14} className="inline mr-1" />
                                    Emails Destinatarios
                                </label>
                                <textarea
                                    value={schedule.recipientsEmails}
                                    onChange={(e) => setSchedule({ ...schedule, recipientsEmails: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white h-24 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                                />
                                <p className="text-xs text-slate-500 mt-1">Separar múltiples emails con comas</p>
                            </div>

                            <button
                                onClick={handleSaveSchedule}
                                disabled={saving}
                                className={`w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    </div>

                    {/* Generate Now */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-amber-400" />
                            Generar Manualmente
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Desde</label>
                                <input
                                    type="date"
                                    value={period.start}
                                    onChange={(e) => setPeriod({ ...period, start: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Hasta</label>
                                <input
                                    type="date"
                                    value={period.end}
                                    onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className={`w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {generating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                {generating ? 'Generando...' : 'Generar Consolidado Ahora'}
                            </button>
                            <p className="text-xs text-slate-500 text-center">
                                Si hay emails configurados y SMTP activo, se enviará automáticamente
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - History */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-400" />
                        Historial de Reportes
                        {reports.length > 0 && (
                            <span className="text-sm font-normal text-slate-400 ml-2">({reports.length} reportes)</span>
                        )}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="pb-4 font-medium text-slate-400 text-sm">Periodo</th>
                                    <th className="pb-4 font-medium text-slate-400 text-sm">Multas</th>
                                    <th className="pb-4 font-medium text-slate-400 text-sm">Total USD</th>
                                    <th className="pb-4 font-medium text-slate-400 text-sm">Estado</th>
                                    <th className="pb-4 font-medium text-slate-400 text-sm">Fecha</th>
                                    <th className="pb-4 font-medium text-slate-400 text-sm text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {reports.map((report: any) => (
                                    <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4">
                                            <div className="text-white text-sm">
                                                {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-slate-300">{report.items?.length || 0}</span>
                                        </td>
                                        <td className="py-4">
                                            <span className="font-bold text-emerald-400">${Number(report.totalUsd).toFixed(2)}</span>
                                        </td>
                                        <td className="py-4">
                                            {getStatusBadge(report.status)}
                                        </td>
                                        <td className="py-4">
                                            <span className="text-slate-400 text-sm">{formatDate(report.createdAt)}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={(e) => handleSendNow(report.id, e)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Enviar por email ahora"
                                                    disabled={sendingEmail === report.id}
                                                >
                                                    {sendingEmail === report.id ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintReport(report)}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Descargar PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-500">
                                            <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                            <p>No hay reportes generados aún.</p>
                                            <p className="text-sm mt-1">Usa el botón "Generar Consolidado Ahora" para crear tu primer reporte.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Report Detail Modal */}
            <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Detalle del Reporte Consolidado">
                {selectedReport && (
                    <div className="space-y-5">
                        <div className="text-center bg-gradient-to-r from-emerald-900/30 to-blue-900/30 p-6 rounded-xl border border-emerald-800/30">
                            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Total del Periodo</p>
                            <p className="text-4xl font-bold text-white">${Number(selectedReport.totalUsd).toFixed(2)} <span className="text-lg text-slate-400">USD</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Periodo</p>
                                <span className="text-white text-sm">{formatDate(selectedReport.periodStart)} - {formatDate(selectedReport.periodEnd)}</span>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                                {getStatusBadge(selectedReport.status)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Multas Incluidas</p>
                                <span className="text-white text-xl font-bold">{selectedReport.items?.length || 0}</span>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Generado</p>
                                <span className="text-white text-sm">{formatDate(selectedReport.createdAt)}</span>
                            </div>
                        </div>

                        {selectedReport.sentAt && (
                            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800/30 flex items-center gap-3">
                                <Mail size={18} className="text-emerald-400" />
                                <div>
                                    <p className="text-emerald-300 font-medium">Enviado por email</p>
                                    <p className="text-emerald-400/60 text-sm">{formatDate(selectedReport.sentAt)}</p>
                                </div>
                            </div>
                        )}

                        {selectedReport.items && selectedReport.items.length > 0 && (
                            <div>
                                <p className="text-sm text-slate-400 mb-2 font-medium">Detalle de Multas:</p>
                                <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden max-h-48 overflow-y-auto">
                                    {selectedReport.items.map((item: any, i: number) => (
                                        <div key={item.id} className={`flex justify-between items-center px-4 py-3 ${i > 0 ? 'border-t border-slate-700' : ''}`}>
                                            <span className="text-slate-300 text-sm">Multa #{i + 1}</span>
                                            <span className="text-emerald-400 font-bold">${Number(item.amountUsd).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => handleSendNow(selectedReport.id)}
                                disabled={sendingEmail === selectedReport.id}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                {sendingEmail === selectedReport.id ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                Enviar Email Ahora
                            </button>
                            <button
                                onClick={() => {
                                    handlePrintReport(selectedReport);
                                    setSelectedReport(null);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                Descargar PDF
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 text-center">ID: {selectedReport.id}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
