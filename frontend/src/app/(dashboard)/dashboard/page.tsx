'use client'

import React from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Mail } from 'lucide-react';

export default function DashboardPage() {
    const stats = [
        { label: 'Multas Pendientes', value: '$1,250.00', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Infracciones Hoy', value: '12', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Reportes Enviados', value: '45', icon: Mail, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Crecimiento', value: '+15%', icon: TrendingUp, color: 'text-primary-400', bg: 'bg-primary-400/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Panel Principal</h1>
                <p className="text-slate-400">Resumen de actividad operativa de la flota</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center">
                    <p className="text-slate-500 italic">Gráfico de Infracciones Semanales (Próximamente)</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center">
                    <p className="text-slate-500 italic">Top Vehículos con más Multas (Próximamente)</p>
                </div>
            </div>
        </div>
    );
}
