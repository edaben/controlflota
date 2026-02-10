import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Settings,
    Truck,
    LogOut,
    Mail,
    User,
    Building2,
    Webhook
} from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/tenants', icon: Building2, label: 'Clientes' },
        { href: '/users', icon: User, label: 'Usuarios' },
        { href: '/infractions', icon: AlertTriangle, label: 'Infracciones' },
        { href: '/fines', icon: FileText, label: 'Multas' },
        { href: '/consolidated', icon: Mail, label: 'Consolidados' },
        { href: '/vehicles', icon: Truck, label: 'Vehículos' },
        { href: '/rules', icon: Settings, label: 'Reglas' },
        { href: '/settings/webhook', icon: Webhook, label: 'Webhook' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Control Bus
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
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
