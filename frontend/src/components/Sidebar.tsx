import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Settings,
    Truck,
    Route,
    LogOut,
    Mail,
    User,
    Building2
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/tenants', icon: Building2, label: 'Clientes' },
        { to: '/users', icon: User, label: 'Usuarios' },
        { to: '/infractions', icon: AlertTriangle, label: 'Infracciones' },
        { to: '/fines', icon: FileText, label: 'Multas' },
        { to: '/consolidated', icon: Mail, label: 'Consolidados' },
        { to: '/vehicles', icon: Truck, label: 'Vehículos' },
        { to: '/rules', icon: Settings, label: 'Reglas' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Control Bus
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
