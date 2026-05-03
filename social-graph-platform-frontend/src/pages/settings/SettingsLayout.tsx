// src/pages/settings/SettingsLayout.tsx
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    Shield, Lock, UserX, Menu, X, ChevronRight,
} from 'lucide-react';

const sidebarItems = [
    { to: '/settings/privacy', label: 'Quyền riêng tư', icon: Lock },
    { to: '/settings/blocked-users', label: 'Danh sách chặn', icon: UserX },
    { to: '/settings/security', label: 'Bảo mật & Đăng nhập', icon: Shield },
];

const SettingsLayout: React.FC = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const location = useLocation();

    const currentItem = sidebarItems.find((item) =>
        location.pathname.startsWith(item.to)
    );
    const pageTitle = currentItem?.label ?? 'Cài đặt';

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-6 lg:gap-8 pt-20">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cài đặt</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Quản lý tài khoản của bạn</p>
                </div>
                <button
                    onClick={() => setMobileNavOpen(!mobileNavOpen)}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white"
                    aria-label="Mở menu cài đặt"
                >
                    {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`${mobileNavOpen ? 'block' : 'hidden'
                    } lg:block lg:w-64 shrink-0 bg-[#1A1825]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 lg:sticky lg:top-24 self-start`}
            >
                <div className="hidden lg:block mb-6">
                    <h1 className="text-2xl font-bold text-white">Cài đặt</h1>
                    <p className="text-gray-400 text-sm mt-1">Quản lý tài khoản của bạn</p>
                </div>

                <nav className="flex flex-col gap-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileNavOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-r from-[#4F6BFF]/20 to-transparent text-white shadow-[0_0_10px_rgba(79,107,255,0.15)] border border-[#4F6BFF]/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <span className="flex items-center gap-3">
                                    <Icon size={18} />
                                    {item.label}
                                </span>
                                <ChevronRight
                                    size={16}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500"
                                />
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Overlay cho mobile */}
            {mobileNavOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileNavOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 w-full max-w-4xl">
                <div className="lg:hidden mb-6">
                    <h2 className="text-xl font-bold text-white">{pageTitle}</h2>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default SettingsLayout;