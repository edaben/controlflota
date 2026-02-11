'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Mail, Server, User, Lock, Send, Save, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SmtpSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [formData, setFormData] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        smtpFromEmail: '',
        smtpFromName: '',
        smtpSecure: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings/smtp');
            setFormData({
                ...formData,
                ...data,
                smtpPassword: '' // Never show password from API
            });
        } catch (err) {
            console.error('Error fetching SMTP settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings/smtp', formData);
            alert('Configuración SMTP guardada exitosamente');
        } catch (err: any) {
            console.error('Error saving SMTP settings:', err);
            alert(`Error al guardar: ${err.response?.data?.error || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) {
            alert('Por favor, ingresa un correo para la prueba');
            return;
        }
        setTesting(true);
        try {
            const { data } = await api.post('/settings/smtp/test', { testEmail });
            alert(data.message || 'Correo de prueba enviado correctamente');
        } catch (err: any) {
            console.error('Error testing SMTP:', err);
            alert(`Error en la prueba: ${err.response?.data?.error || err.message}`);
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Configuración de Correo (SMTP)</h1>
                <p className="text-slate-400">Configura el servidor de correo para el envío automático de multas y reportes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Server size={14} /> Servidor SMTP
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtpHost}
                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="smtp.ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    Puerto
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.smtpPort}
                                    onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                                    placeholder="587"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <User size={14} /> Usuario / Email
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtpUser}
                                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="usuario@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Lock size={14} /> Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.smtpPassword}
                                        onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder={formData.smtpHost ? "•••••••• (Guardado)" : "••••••••"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    Email de Remitente
                                </label>
                                <input
                                    type="email"
                                    value={formData.smtpFromEmail}
                                    onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="notificaciones@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    Nombre de Remitente
                                </label>
                                <input
                                    type="text"
                                    value={formData.smtpFromName}
                                    onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="Control Bus"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <input
                                type="checkbox"
                                id="smtpSecure"
                                checked={formData.smtpSecure}
                                onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                            />
                            <label htmlFor="smtpSecure" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                                Usar Conexión Segura (SSL/TLS)
                            </label>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 ${saving ? 'opacity-50' : ''}`}
                            >
                                <Save size={20} />
                                {saving ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info & Test Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <ShieldCheck size={20} />
                            <h3>Consejos de Seguridad</h3>
                        </div>
                        <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
                            <li className="flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                Siempre que sea posible, utiliza el puerto <b>587</b> con TLS para mayor seguridad.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                Si usas Gmail como servidor, recuerda que necesitas generar una <b>Contraseña de Aplicación</b>.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                Los cambios se aplicarán instantáneamente a todos los envíos automáticos.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg border-t-4 border-t-blue-500">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                            <Send size={20} />
                            <h3>Probar Configuración</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Email de Destino
                                </label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                    placeholder="tu-correo@ejemplo.com"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={testing}
                                className={`w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 ${testing ? 'opacity-50' : ''}`}
                            >
                                <Mail size={18} />
                                {testing ? 'Enviando...' : 'Enviar Email de Prueba'}
                            </button>
                        </div>

                        <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-slate-600" />
                            <p>Recuerda guardar los cambios antes de realizar la prueba, de lo contrario se usará la configuración anterior.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
