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
    Webhook,
    MapPin,
    Shield,
    X
} from 'lucide-react';

import { PERMISSIONS } from '../constants/permissions';
import { hasPermission } from '../utils/permissions';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr);
                setUser(parsedUser);
            } catch (e) {
                console.error('Error parsing user from localStorage', e);
            }
        }
    }, []);

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
        { href: '/tenants', icon: Building2, label: 'Clientes', permission: PERMISSIONS.VIEW_TENANTS },
        { href: '/users', icon: User, label: 'Usuarios', permission: PERMISSIONS.VIEW_USERS },
        { href: '/profiles', icon: Shield, label: 'Perfiles', permission: PERMISSIONS.MANAGE_USERS },
        { href: '/infractions', icon: AlertTriangle, label: 'Infracciones', permission: PERMISSIONS.VIEW_INFRACTIONS },
        { href: '/fines', icon: FileText, label: 'Multas', permission: PERMISSIONS.VIEW_FINES },
        { href: '/consolidated', icon: Mail, label: 'Consolidados', permission: PERMISSIONS.VIEW_REPORTS },
        { href: '/vehicles', icon: Truck, label: 'Vehículos', permission: PERMISSIONS.VIEW_VEHICLES },
        { href: '/routes', icon: MapPin, label: 'Rutas y Paradas', permission: PERMISSIONS.VIEW_ROUTES },
        { href: '/rules', icon: Settings, label: 'Reglas', permission: PERMISSIONS.VIEW_RULES },
        { href: '/settings/smtp', icon: Mail, label: 'Configuración SMTP', permission: PERMISSIONS.MANAGE_SETTINGS },
        { href: '/settings/webhook', icon: Webhook, label: 'Webhook', permission: PERMISSIONS.MANAGE_SETTINGS },
        { href: '/profile', icon: User, label: 'Mi Perfil', permission: PERMISSIONS.VIEW_DASHBOARD },
    ];

    const filteredNavItems = navItems.filter(item => {
        return hasPermission(user, item.permission as any);
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Control Bus
                    </h1>
                    {onClose && (
                        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                        <LogOut size={18} />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
