// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Compass,
    Bell,
    Bookmark,
    Users,
    User as UserIcon,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useUserProfile from '../../hooks/useUserProfile';
import usePendingRequests from '../../hooks/usePendingRequests';
import { useNotificationContext } from '../../context/useNotificationContext';

const NAV_ITEMS = [
    { icon: Home, label: 'Trang chủ', path: '/feed' },
    { icon: Compass, label: 'Khám phá', path: '/explore' },
    { icon: Bell, label: 'Thông báo', path: '/notifications' },
    { icon: Bookmark, label: 'Đã lưu', path: '/saved-posts' },
    { icon: Users, label: 'Bạn bè', path: '/friends', badge: true },
    { icon: UserIcon, label: 'Hồ sơ', path: '/profile' },
    { icon: Settings, label: 'Cài đặt', path: '/settings' },
];

// ────────────────────────────────────────────────────────────────
// Component con hiển thị thông tin người dùng (avatar & tên)
// Sử dụng key={avatarUrl} để tự động remount khi avatar thay đổi,
// giúp reset trạng thái lỗi ảnh mà không cần useEffect setState.
// ────────────────────────────────────────────────────────────────
const SidebarUserInfo: React.FC<{
    avatarUrl: string | null;
    fullName: string;
    userName: string;
    expanded: boolean;
    onLogout: () => void;
}> = ({ avatarUrl, fullName, userName, expanded, onLogout }) => {
    const [imgError, setImgError] = useState(false);

    const handleImageError = () => setImgError(true);

    const avatarContent = (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] p-[2px] shrink-0 group-hover:shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-all duration-300">
            <div className="w-full h-full bg-[#1C1C1E] rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl && !imgError ? (
                    <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <span className="text-[#EBEBF5] font-bold text-sm">
                        {fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                )}
            </div>
        </div>
    );

    if (!expanded) {
        return (
            <div className="flex flex-col items-center gap-2">
                <Link to="/profile/me" title={fullName} className="inline-block">
                    {avatarContent}
                </Link>
                <button
                    onClick={onLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-[#8E8E93] hover:text-[#FF1493] hover:bg-[#FF1493]/10 rounded-lg transition-all"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-2 py-2 rounded-2xl hover:bg-[#252529] transition-colors cursor-pointer group">
            <Link to="/profile/me" className="flex items-center gap-3 min-w-0">
                {avatarContent}
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate w-24 group-hover:text-[#FF1493] transition-colors">
                        {fullName}
                    </span>
                    <span className="text-xs text-[#8E8E93] truncate w-24">@{userName}</span>
                </div>
            </Link>
            <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-2 text-[#8E8E93] hover:text-[#FF1493] hover:bg-[#FF1493]/10 rounded-xl transition-all duration-300 group/logout"
            >
                <LogOut className="w-5 h-5 group-hover/logout:rotate-12 transition-transform" />
            </button>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────
// Sidebar chính
// ────────────────────────────────────────────────────────────────
const Sidebar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const { profile: currentProfile } = useUserProfile('me', 'me');
    const { totalCount: pendingCount } = usePendingRequests();
    const { unreadCount } = useNotificationContext();

    const [expanded, setExpanded] = useState(true);
    const toggleExpanded = () => setExpanded((prev) => !prev);

    const isActive = (path: string) => location.pathname.startsWith(path);

    const userName = currentProfile?.userName || 'username';
    const fullName = currentProfile?.fullName || 'Người dùng';
    const avatarUrl = currentProfile?.avatarUrl || null;

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-[#1C1C1E] border-r border-white/[0.07] flex flex-col py-6 z-40 overflow-hidden transition-all duration-300 ${expanded ? 'w-60' : 'w-16'
                }`}
        >
            {/* Background glow */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#FF1493]/5 to-transparent pointer-events-none" />

            {/* Logo & Toggle */}
            <div
                className={`flex items-center justify-between px-3 mb-10 shrink-0 relative z-10 ${expanded ? 'gap-3' : 'justify-center'
                    }`}
            >
                <Link to="/feed" className={`flex items-center gap-3 group ${expanded ? '' : 'justify-center'}`}>
                    <div className="w-10 h-10 bg-[#252529] border border-[#FF1493] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.3)] group-hover:shadow-[0_0_25px_rgba(255,20,147,0.5)] transition-all duration-300 shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="6" r="3" fill="#FF1493" />
                            <circle cx="6" cy="17" r="3" fill="#FF1493" />
                            <circle cx="18" cy="17" r="3" fill="#FF1493" />
                            <line x1="10.5" y1="9" x2="7.5" y2="14" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" />
                            <line x1="13.5" y1="9" x2="16.5" y2="14" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" />
                            <line x1="8.5" y1="17" x2="15.5" y2="17" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    {expanded && (
                        <span className="text-2xl font-bold text-white tracking-wide group-hover:text-[#FF1493] transition-colors whitespace-nowrap">
                            Interact<span className="text-[#FF1493]">Hub</span>
                        </span>
                    )}
                </Link>
                <button
                    onClick={toggleExpanded}
                    className="text-[#8E8E93] hover:text-white hover:bg-[#252529] rounded-lg p-1.5 transition-colors shrink-0"
                    title={expanded ? 'Thu gọn' : 'Mở rộng'}
                >
                    {expanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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

                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    const showNotificationBadge = item.path === '/notifications' && unreadCount !== null && unreadCount > 0;
                    const showFriendBadge = item.badge && pendingCount > 0;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between rounded-2xl transition-all duration-300 group relative min-h-[44px] ${expanded ? 'px-4 py-3.5' : 'px-0 py-3 justify-center'
                                } ${active
                                    ? 'bg-gradient-to-r from-[#FF1493]/20 to-transparent font-bold shadow-[0_0_15px_rgba(255,20,147,0.1)]'
                                    : 'text-[#8E8E93] hover:bg-[#252529] hover:text-white font-medium'
                                }`}
                            title={!expanded ? item.label : undefined}
                        >
                            {active && expanded && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF1493] rounded-r-full shadow-[0_0_10px_rgba(255,20,147,0.8)]" />
                            )}

                            <div className={`flex items-center ${expanded ? 'gap-4' : 'justify-center'}`}>
                                <Icon
                                    className={`w-5 h-5 transition-all duration-300 ${active
                                            ? 'text-[#FF1493] drop-shadow-[0_0_8px_rgba(255,20,147,0.6)]'
                                            : 'group-hover:scale-110'
                                        }`}
                                />
                                {expanded && (
                                    <span
                                        className={`text-[15px] transition-all duration-300 ${active
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4F6BFF]'
                                                : ''
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                )}
                            </div>

                            {!expanded && (showNotificationBadge || showFriendBadge) && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#4F6BFF] rounded-full shadow-[0_0_6px_rgba(79,107,255,0.6)] animate-pulse" />
                            )}
                            {expanded && (
                                <div className="flex items-center gap-1">
                                    {showNotificationBadge && (
                                        <span className="bg-[#4F6BFF] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(79,107,255,0.5)] animate-in zoom-in">
                                            {unreadCount! > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {showFriendBadge && (
                                        <span className="bg-[#4F6BFF] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(79,107,255,0.5)] animate-in zoom-in">
                                            {pendingCount > 99 ? '99+' : pendingCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="mt-4 pt-4 border-t border-white/[0.07] shrink-0 relative z-10">
                {/* Dùng key={avatarUrl} để tự động remount khi avatar thay đổi */}
                <SidebarUserInfo
                    key={avatarUrl}
                    avatarUrl={avatarUrl}
                    fullName={fullName}
                    userName={userName}
                    expanded={expanded}
                    onLogout={logout}
                />
            </div>
        </aside>
    );
};

export default Sidebar;