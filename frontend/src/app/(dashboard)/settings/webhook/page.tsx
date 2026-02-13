'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Webhook, Copy, CheckCircle, Activity, AlertCircle, Settings as SettingsIcon, Trash2, MapPin, Zap, User, Lock } from 'lucide-react';
import Modal from '@/components/Modal';

export default function SettingsPage() {
    const router = useRouter();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, errors: 0 });
    const [selectedRawLog, setSelectedRawLog] = useState<any>(null);
    const [user, setUser] = useState<any>(null);



    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr);
                setUser(parsedUser);
                if (parsedUser.role === 'CLIENT_USER') {
                    router.push('/dashboard');
                    return;
                }
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
        // Get webhook URL from environment or backend
        const baseUrl = window.location.origin.replace('3001', '3000');
        setWebhookUrl(`${baseUrl}/api/webhook/traccar`);

        fetchWebhookLogs();
    }, []);

    const fetchWebhookLogs = async () => {
        try {
            const { data } = await api.get('/webhook/logs?limit=10');
            setLogs(data.logs || []);
            setStats(data.stats || { total: 0, today: 0, errors: 0 });

            if (data.apiKey) {
                const baseUrl = window.location.origin.replace('3001', '3000');
                setWebhookUrl(`${baseUrl}/api/webhook/traccar?apiKey=${data.apiKey}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('¿Estás seguro de que deseas limpiar todo el historial de eventos recientes? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await api.delete('/webhook/logs');
            setLogs([]);
            setStats(prev => ({ ...prev, total: 0, today: 0 }));
            alert('Historial limpiado correctamente');
        } catch (err) {
            console.error('Error clearing logs:', err);
            alert('Error al limpiar el historial');
        }
    };

    const renderEventDetail = (log: any) => {
        const p = log.payload || {};

        switch (log.eventType) {
            case 'geofenceEnter':
            case 'geofenceExit':
                const geoName = p.geofence?.name || p.additional?.geofence || 'Geocerca desconocida';
                return (
                    <span className="flex items-center gap-1.5 text-blue-400">
                        <MapPin size={12} />
                        {geoName}
                    </span>
                );
            case 'deviceOverspeed':
                const speedKmh = p.speed ? Math.round(p.speed * 1.852) : 0;
                return (
                    <span className="flex items-center gap-1.5 text-orange-400">
                        <Zap size={12} />
                        {speedKmh} km/h
                    </span>
                );
            case 'ignitionOn':
            case 'ignitionOff':
                return (
                    <span className="text-slate-400">Vehículo {log.eventType === 'ignitionOn' ? 'Encendido' : 'Apagado'}</span>
                );
            case 'alarm':
                return (
                    <span className="text-red-400 animate-pulse">Alarma: {p.alarm || 'Alerta Crítica'}</span>
                );
            default:
                return <span className="text-slate-500 italic">Sin detalles extra</span>;
        }
    };



    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [isSaving, setIsSaving] = useState(false);



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



            {/* Stats Cards */}
            {user?.role === 'SUPER_ADMIN' ? (
                <>
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
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Eventos Recientes del Webhook</h3>
                            {logs.length > 0 && (
                                <button
                                    onClick={handleClearLogs}
                                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Trash2 size={16} />
                                    Limpiar Historial
                                </button>
                            )}
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                    <th className="px-6 py-4 font-medium">Timestamp</th>
                                    <th className="px-6 py-4 font-medium">Vehículo</th>
                                    <th className="px-6 py-4 font-medium">Tipo</th>
                                    <th className="px-6 py-4 font-medium">Detalle</th>
                                    <th className="px-6 py-4 font-medium">Device ID</th>
                                    <th className="px-6 py-4 font-medium">Estado</th>
                                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {logs.map((log: any, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 text-sm">
                                            {new Date(log.timestamp).toLocaleString('es-EC')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs font-mono border border-slate-700">
                                                {log.vehiclePlate || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{log.eventType || 'position'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {renderEventDetail(log)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">{log.deviceId || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.success
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {log.success ? 'Procesado' : 'Error'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedRawLog(log)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline transition-colors"
                                            >
                                                Ver JSON
                                            </button>
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
                </>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-slate-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Acceso Restringido</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        La visualización de eventos en tiempo real y datos técnicos está reservada para el Super Administrador del sistema.
                    </p>
                </div>
            )}

            {/* JSON Modal */}
            <Modal
                isOpen={!!selectedRawLog}
                onClose={() => setSelectedRawLog(null)}
                title="Datos Crudos del Webhook (JSON)"
            >
                {selectedRawLog && (
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[60vh]">
                                {JSON.stringify(selectedRawLog.payload, null, 2)}
                            </pre>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>ID Dispositivo: {selectedRawLog.deviceId}</span>
                            <span>Fecha: {new Date(selectedRawLog.timestamp).toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => setSelectedRawLog(null)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
