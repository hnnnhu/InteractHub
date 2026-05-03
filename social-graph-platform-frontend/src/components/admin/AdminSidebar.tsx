// src/components/admin/AdminSidebar.tsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Shield,
} from 'lucide-react';

const menuItems = [
    { to: '/admin/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
    { to: '/admin/posts', label: 'Bài viết', icon: FileText },
    { to: '/admin/reports', label: 'Báo cáo', icon: AlertTriangle },
];

interface AdminSidebarProps {
    onToggle?: (expanded: boolean) => void; // ✅ thêm prop interface
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onToggle }) => {
    const location = useLocation();
    const [expanded, setExpanded] = useState(true);

    const handleToggle = () => {
        const next = !expanded;
        setExpanded(next);
        if (onToggle) onToggle(next);
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-[#1C1C1E] border-r border-white/[0.07] flex flex-col py-6 z-40 overflow-hidden transition-all duration-300 ${expanded ? 'w-60' : 'w-16'
                }`}
        >
            {/* Background glow */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#FF1493]/10 to-transparent pointer-events-none" />

            {/* Logo & Toggle */}
            <div
                className={`flex items-center justify-between px-3 mb-8 shrink-0 relative z-10 ${expanded ? 'gap-3' : 'justify-center'
                    }`}
            >
                <div className={`flex items-center gap-3 ${expanded ? '' : 'justify-center'}`}>
                    <div className="w-10 h-10 bg-[#252529] border border-[#FF1493] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.3)] shrink-0">
                        <Shield className="w-5 h-5 text-[#FF1493]" />
                    </div>
                    {expanded && (
                        <span className="text-xl font-bold tracking-wide whitespace-nowrap">
                            Admin<span className="text-[#FF1493]">Hub</span>
                        </span>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    className="text-[#8E8E93] hover:text-white hover:bg-[#252529] rounded-lg p-1.5 transition-colors shrink-0"
                    title={expanded ? 'Thu gọn' : 'Mở rộng'}
                >
                    {expanded ? (
                        <ChevronLeft className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 relative z-10">
                <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6B7280; }
        `}</style>

                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`flex items-center rounded-2xl transition-all duration-300 group relative min-h-[44px] ${expanded ? 'px-4 py-3.5' : 'px-0 py-3 justify-center'
                                } ${isActive
                                    ? 'bg-[#FF1493]/20 font-bold shadow-[0_0_15px_rgba(255,20,147,0.1)]'
                                    : 'text-[#8E8E93] hover:bg-[#252529] hover:text-white font-medium'
                                }`}
                            title={!expanded ? item.label : undefined}
                        >
                            {isActive && expanded && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF1493] rounded-r-full shadow-[0_0_10px_rgba(255,20,147,0.8)]" />
                            )}

                            <div className={`flex items-center ${expanded ? 'gap-4' : 'justify-center'}`}>
                                <Icon
                                    className={`w-5 h-5 transition-all duration-300 ${isActive
                                            ? 'text-[#FF1493] drop-shadow-[0_0_8px_rgba(255,20,147,0.6)]'
                                            : 'group-hover:scale-110'
                                        }`}
                                />
                                {expanded && (
                                    <span className="text-[15px] transition-all duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                            {isActive && expanded && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF1493]" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto px-4 py-4 border-t border-white/[0.07] shrink-0 relative z-10">
                <p className="text-xs text-gray-500 text-center">
                    {expanded ? `© ${new Date().getFullYear()} SocialGraph` : '©'}
                </p>
            </div>
        </aside>
    );
};

export default AdminSidebar;