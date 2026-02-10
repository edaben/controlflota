'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Webhook, Copy, CheckCircle, Activity, AlertCircle, Mail, Send, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, errors: 0 });

    // SMTP State
    const [smtpConfig, setSmtpConfig] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        smtpFromEmail: '',
        smtpFromName: '',
        smtpSecure: false
    });
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        // Get webhook URL from environment or backend
        const baseUrl = window.location.origin.replace('3001', '3000');
        setWebhookUrl(`${baseUrl}/api/webhook/traccar`);

        fetchWebhookLogs();
        fetchSmtpConfig();
    }, []);

    const fetchWebhookLogs = async () => {
        try {
            const { data } = await api.get('/webhook/logs?limit=10');
            setLogs(data.logs || []);
            setStats(data.stats || { total: 0, today: 0, errors: 0 });
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSmtpConfig = async () => {
        try {
            const { data } = await api.get('/settings/smtp');
            setSmtpConfig({
                smtpHost: data.smtpHost || '',
                smtpPort: data.smtpPort || 587,
                smtpUser: data.smtpUser || '',
                smtpPassword: '',
                smtpFromEmail: data.smtpFromEmail || '',
                smtpFromName: data.smtpFromName || '',
                smtpSecure: data.smtpSecure || false
            });
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSmtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/settings/smtp', smtpConfig);
            alert('✅ Configuración SMTP guardada exitosamente');
            // Limpiar el campo de contraseña en el estado local después de guardar por seguridad
            setSmtpConfig(prev => ({ ...prev, smtpPassword: '' }));
        } catch (err: any) {
            console.error(err);
            alert('❌ ' + (err.response?.data?.error || 'Error al guardar configuración SMTP'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            alert('Por favor ingresa un email de prueba');
            return;
        }

        try {
            const { data } = await api.post('/settings/smtp/test', { testEmail });
            setTestResult({ success: true, message: data.message });
            setTimeout(() => setTestResult(null), 5000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Error al enviar correo de prueba';
            const details = err.response?.data?.details ? ` (${err.response.data.details})` : '';
            setTestResult({
                success: false,
                message: `${errorMsg}${details}`
            });
            setTimeout(() => setTestResult(null), 10000); // 10 seconds for detailed errors
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Configuración del Sistema</h1>
                <p className="text-slate-400">Gestiona las integraciones y configuraciones de tu tenant</p>
            </div>

            {/* Webhook Section */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Webhook className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Webhook de Traccar</h3>
                        <p className="text-sm text-slate-400">Configura esta URL en Traccar para recibir eventos GPS</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <code className="text-emerald-400 font-mono text-sm flex-1">{webhookUrl}</code>
                    <button
                        onClick={copyToClipboard}
                        className="ml-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        {copied ? (
                            <>
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span>Copiado</span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                <span>Copiar</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-400" />
                        Instrucciones de Configuración
                    </h4>
                    <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
                        <li>Accede a tu panel de Traccar</li>
                        <li>Ve a <strong>Configuración → Notificaciones</strong></li>
                        <li>Crea una nueva notificación de tipo <strong>Webhook</strong></li>
                        <li>Pega la URL del webhook mostrada arriba</li>
                        <li>Selecciona los eventos que deseas recibir (Posición, Geofence, etc.)</li>
                        <li>Guarda la configuración</li>
                    </ol>
                </div>
            </div>

            {/* SMTP Configuration Section */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Mail className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Configuración SMTP</h3>
                        <p className="text-sm text-slate-400">Configura el servidor de correo para envío de notificaciones</p>
                    </div>
                </div>

                <form onSubmit={handleSmtpSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Host SMTP
                            </label>
                            <input
                                type="text"
                                value={smtpConfig.smtpHost}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpHost: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="smtp.gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Puerto
                            </label>
                            <input
                                type="number"
                                value={smtpConfig.smtpPort}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpPort: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="587"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Usuario SMTP
                            </label>
                            <input
                                type="text"
                                value={smtpConfig.smtpUser}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpUser: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="usuario@gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña SMTP
                            </label>
                            <input
                                type="password"
                                value={smtpConfig.smtpPassword}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Remitente
                            </label>
                            <input
                                type="email"
                                value={smtpConfig.smtpFromEmail}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpFromEmail: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="noreply@tuempresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nombre Remitente
                            </label>
                            <input
                                type="text"
                                value={smtpConfig.smtpFromName}
                                onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpFromName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Control Bus"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="smtpSecure"
                            checked={smtpConfig.smtpSecure}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpSecure: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                        />
                        <label htmlFor="smtpSecure" className="text-sm text-slate-300">
                            Usar SSL/TLS (puerto 465)
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Configuración'
                            )}
                        </button>
                    </div>
                </form>

                {/* Test Email Section */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Send size={16} className="text-emerald-400" />
                        Probar Configuración
                    </h4>
                    <div className="flex gap-3">
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="correo@ejemplo.com"
                        />
                        <button
                            onClick={handleTestEmail}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Enviar Prueba
                        </button>
                    </div>
                    {testResult && (
                        <div className={`mt-3 p-3 rounded-lg ${testResult.success
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                            {testResult.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Activity className="text-blue-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                    <div className="text-sm text-slate-400">Total de Eventos</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.today}</div>
                    <div className="text-sm text-slate-400">Eventos Hoy</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <AlertCircle className="text-red-400" size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.errors}</div>
                    <div className="text-sm text-slate-400">Errores</div>
                </div>
            </div>

            {/* Recent Events */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Eventos Recientes del Webhook</h3>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Timestamp</th>
                            <th className="px-6 py-4 font-medium">Tipo</th>
                            <th className="px-6 py-4 font-medium">Device ID</th>
                            <th className="px-6 py-4 font-medium">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {logs.map((log: any, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-300 text-sm">
                                    {new Date(log.timestamp).toLocaleString('es-EC')}
                                </td>
                                <td className="px-6 py-4 text-white font-medium">{log.eventType || 'position'}</td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-sm">{log.deviceId || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.success
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {log.success ? 'Procesado' : 'Error'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No hay eventos recibidos aún.
                                    <br />
                                    <span className="text-sm">Configura el webhook en Traccar para comenzar a recibir eventos.</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
