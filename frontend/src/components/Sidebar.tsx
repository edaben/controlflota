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
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { PERMISSIONS } from '../constants/permissions';
import { hasPermission } from '../utils/permissions';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) => {
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
                fixed lg:fixed inset-y-0 left-0 z-50
                ${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800
                transform transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800/50`}>
                    {!isCollapsed && (
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent truncate">
                                Control Bus
                            </h1>
                        </div>
                    )}
                    {isCollapsed && (
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                    )}

                    <div className="flex items-center space-x-1">
                        {onToggleCollapse && (
                            <button
                                onClick={onToggleCollapse}
                                className="hidden lg:flex p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                                title={isCollapsed ? "Expandir" : "Contraer"}
                            >
                                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                        )}
                        {onClose && (
                            <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon size={20} className="flex-shrink-0" />
                                {!isCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all`}
                        title={isCollapsed ? 'Cerrar Sesión' : ''}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
