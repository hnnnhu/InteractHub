// src/components/admin/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, ArrowLeft } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    const avatarUrl = resolveUrl(user?.avatarUrl);

    const getInitial = (): string => {
        if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
        if (user?.userName) return user.userName.charAt(0).toUpperCase();
        return 'A';
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex h-screen bg-[#0D0C13] text-white">
            {/* Sidebar admin – truyền callback để biết trạng thái */}
            <AdminSidebar onToggle={setSidebarExpanded} />

            {/* Khu vực chính – margin-left tương ứng với sidebar */}
            <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarExpanded ? 'ml-60' : 'ml-16'
                    }`}
            >
                {/* Header bar */}
                <header className="h-16 bg-[#1C1C1E] border-b border-white/[0.07] flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-[#FF1493]" />
                        <h1 className="text-lg font-bold tracking-wide">
                            Admin <span className="text-[#FF1493]">Panel</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/feed')}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#252529] rounded-lg transition-colors"
                            title="Về trang người dùng"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Giao diện User</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">{user?.fullName || 'Admin'}</p>
                                <p className="text-xs text-gray-400">Quản trị viên</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] p-[2px]">
                                <div className="w-full h-full bg-[#1C1C1E] rounded-full flex items-center justify-center overflow-hidden">
                                    {avatarUrl && !imgError ? (
                                        <img
                                            src={avatarUrl}
                                            alt={user?.fullName || 'Avatar'}
                                            className="w-full h-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                    ) : (
                                        <span className="text-xs font-bold">{getInitial()}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-[#FF1493] hover:bg-[#252529] rounded-lg transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;