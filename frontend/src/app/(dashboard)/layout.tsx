'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="flex bg-slate-950 min-h-screen relative">
            {/* Hamburger Button for Mobile */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} lg:p-8 p-4 pt-16 lg:pt-8 overflow-y-auto`}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
