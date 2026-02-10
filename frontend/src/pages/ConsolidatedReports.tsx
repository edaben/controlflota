import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Mail, Clock, Calendar, CheckCircle, AlertCircle, Download, Share2 } from 'lucide-react';

const ConsolidatedReports = () => {
    const [reports, setReports] = useState([]);
    const [config, setConfig] = useState({
        enabled: true,
        frequency: 'DAILY',
        sendTimeLocal: '23:59',
        recipientsEmails: '',
        includeStatus: 'CONFIRMED_ONLY'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: reportsData } = await api.get('/reports/consolidated-reports');
            setReports(reportsData);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Reportes Consolidados</h1>
                <p className="text-slate-400">Automatización de envíos programados por email</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuración */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-primary-400" />
                        Programación
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Frecuencia</label>
                            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500">
                                <option value="DAILY">Diario</option>
                                <option value="WEEKLY">Semanal</option>
                                <option value="MONTHLY">Mensual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Hora de Envío</label>
                            <input type="time" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" defaultValue="23:59" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Emails Destinatarios</label>
                            <textarea
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white h-24"
                                placeholder="separados por coma..."
                            />
                        </div>

                        <button className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-900/20">
                            Guardar Configuración
                        </button>

                        <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700">
                            Generar Consolidado Ahora
                        </button>
                    </div>
                </div>

                {/* Historial */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-400" />
                        Historial de Envíos
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="pb-4 font-medium text-slate-400">Periodo</th>
                                    <th className="pb-4 font-medium text-slate-400">Total USD</th>
                                    <th className="pb-4 font-medium text-slate-400">Estado</th>
                                    <th className="pb-4 font-medium text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {reports.map((report: any) => (
                                    <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4">
                                            <div className="text-white">
                                                {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4 font-bold text-white">${report.totalUsd}</td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                                                }`}>
                                                {report.status === 'SENT' ? 'Enviado' : report.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Ver detalle">
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Descargar PDF">
                                                    <Download size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Compartir">
                                                    <Share2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedReports;
