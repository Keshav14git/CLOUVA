import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Vault, BrainCircuit, MessageSquare, LogOut, Brain, Settings, ChevronRight, Menu, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/vault', label: 'Vault', icon: Vault },
        { path: '/neuro-graph', label: 'Neuro-Graph', icon: BrainCircuit },
        { path: '/chat', label: 'Assistant', icon: MessageSquare },
    ];

    const bottomNavItems = [
        { path: '/settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="flex h-screen bg-background text-text overflow-hidden">
            {/* Minimal Sidebar - Redesign: Red & Connected */}
            <motion.aside
                initial={{ width: 256 }}
                animate={{ width: isSidebarOpen ? 256 : 72 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="flex-shrink-0 bg-primary flex flex-col z-20 relative"
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-5 justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <img src={isSidebarOpen ? "/c3.png" : "/c4.png"} alt="Clouva" className="h-8 w-auto object-contain transition-all duration-300" />
                    </div>
                </div>

                {/* External Toggle Handle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-4 right-0 translate-x-full h-8 w-6 bg-primary rounded-r-lg flex items-center justify-center text-white cursor-pointer shadow-md hover:brightness-110 transition-all z-50"
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-1">
                    {/* Main Group */}
                    <div className="px-3 mb-2 mt-4">
                    </div>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center gap-3 py-3 transition-all duration-200 relative ${isActive
                                    ? 'bg-zinc-50 text-primary rounded-l-2xl rounded-r-none mr-0 ml-4 shadow-none'
                                    : 'text-red-100/70 hover:text-white hover:bg-white/10 mx-3 rounded-lg px-3'
                                    }`}
                            >
                                <div className={`relative z-10 flex items-center gap-3 ${isActive ? 'pl-3' : ''}`}>
                                    <item.icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-current'}`} />
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="font-medium text-sm whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Connector Curves for Active Tab (Optional for extra polish, handled by rounded-l-2xl for now) */}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Nav */}
                <div className="py-3 border-t border-white/10 space-y-1">
                    {bottomNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center gap-3 py-3 transition-all duration-200 relative ${isActive
                                    ? 'bg-zinc-50 text-primary rounded-l-2xl rounded-r-none mr-0 ml-4 shadow-none'
                                    : 'text-red-100/70 hover:text-white hover:bg-white/10 mx-3 rounded-lg px-3'
                                    }`}
                            >
                                <div className={`relative z-10 flex items-center gap-3 ${isActive ? 'pl-3' : ''}`}>
                                    <item.icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-current'}`} />
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="font-medium text-sm whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden flex flex-col bg-surface">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-white z-10 sticky top-0">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span className="hover:text-text transition-colors cursor-pointer">App</span>
                        <ChevronRight size={14} className="text-zinc-300" />
                        <span className="text-text font-medium capitalize">{location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-text">{user?.name}</p>
                            <p className="text-xs text-text-muted">{user?.email}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-sm font-bold text-primary">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>

                <div className={`flex-1 ${location.pathname === '/chat' || location.pathname === '/neuro-graph' ? 'overflow-hidden p-0' : 'overflow-y-auto p-6 lg:p-10 scroll-smooth'}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={`${location.pathname === '/chat' || location.pathname === '/neuro-graph' ? 'h-full' : 'max-w-7xl mx-auto'}`}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
