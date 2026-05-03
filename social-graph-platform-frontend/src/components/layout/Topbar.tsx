// src/components/layout/Topbar.tsx
import React, { useState } from 'react';
import { Bell, Menu, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import usePendingRequests from '../../hooks/usePendingRequests';
import GlobalSearchDropdown from '../search/GlobalSearchDropdown';
import axiosInstance from '../../api/axiosInstance';

const Topbar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { totalCount: pendingCount } = usePendingRequests();
    const [imgError, setImgError] = useState(false);

    const resolveUrl = (url?: string | null): string | null => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
        const rootUrl = baseURL.replace(/\/api\/?$/, '');
        return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const getInitial = (): string => {
        if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
        if (user?.userName) return user.userName.charAt(0).toUpperCase();
        return 'U';
    };

    const avatarUrl = resolveUrl(user?.avatarUrl);

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-60 h-[76px] bg-[#1C1C1E] border-b border-white/[0.07] z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300">
            {/* Nút Menu Hamburger – chỉ hiển thị trên mobile */}
            <button
                className="lg:hidden p-2 text-[#8E8E93] hover:text-white hover:bg-[#252529] rounded-xl transition-colors mr-4"
                aria-label="Mở menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Thanh tìm kiếm trung tâm – tối ưu không gian */}
            <div className="flex-1 flex justify-center sm:justify-start relative max-w-xl lg:max-w-none">
                <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
                    <GlobalSearchDropdown />
                    {/* Phím tắt gợi ý nằm gọn góc phải input */}
                    
                </div>
            </div>

            {/* Nhóm biểu tượng hành động & người dùng */}
            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
                {/* Lời mời kết bạn */}
                <button
                    onClick={() => navigate('/friends/requests')}
                    className="relative p-2.5 text-[#8E8E93] hover:text-[#4F6BFF] hover:bg-[#252529] rounded-full transition-all border border-white/[0.07] hover:border-[#4F6BFF]/30 group"
                    title="Lời mời kết bạn"
                >
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#4F6BFF] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(79,107,255,0.6)] border-2 border-[#1C1C1E] animate-in zoom-in">
                            {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                    )}
                </button>

                {/* Thông báo */}
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2.5 text-[#8E8E93] hover:text-[#FFB800] hover:bg-[#252529] rounded-full transition-colors border border-white/[0.07] hover:border-[#FFB800]/30 group"
                    title="Thông báo"
                >
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_8px_rgba(255,184,0,0.8)] border border-[#1C1C1E]" />
                </button>

                {/* Thanh phân cách */}
                <div className="hidden sm:block h-8 w-[1px] bg-white/[0.07] mx-1" />

                {/* Hồ sơ người dùng */}
                <div
                    onClick={() => navigate(`/profile/${user?.userName}`)}
                    className="flex items-center gap-3 cursor-pointer group pl-1"
                >
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-semibold text-white group-hover:text-[#4F6BFF] transition-colors">
                            {user?.fullName || 'Người dùng'}
                        </span>
                        <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                            Đang hoạt động
                        </span>
                    </div>

                    <div className="w-10 h-10 rounded-full border-2 border-white/[0.07] p-[2px] group-hover:border-[#4F6BFF] transition-all duration-300 relative">
                        <div className="w-full h-full bg-[#252529] rounded-full overflow-hidden flex items-center justify-center">
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    alt={user?.fullName || 'Avatar'}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-[#4F6BFF] font-bold text-sm">
                                    {getInitial()}
                                </span>
                            )}
                        </div>
                        {/* Trạng thái online */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1C1C1E] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;