// src/components/user/UserAvatar.tsx
import React, { useState, useMemo, forwardRef } from 'react';
import { Link } from 'react-router-dom';

export interface UserAvatarProps {
    /** Tên định danh (dùng cho Link) */
    userName: string;
    /** Tên hiển thị (dùng để tạo chữ cái viết tắt hoặc alt) */
    fullName: string;
    /** Đường dẫn ảnh */
    avatarUrl?: string | null;
    /** Kích thước chuẩn hóa */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    /** Tắt chức năng chuyển hướng */
    disableLink?: boolean;
    /** Bật viền gradient báo hiệu có Story mới (giống Instagram) */
    hasStory?: boolean;
    /** Hiển thị chấm xanh báo trạng thái Online */
    isOnline?: boolean;
    /** Trạng thái bộ xương (Skeleton) khi đang tải dữ liệu */
    isLoading?: boolean;
    /** Sự kiện click mở rộng */
    onClick?: (e: React.MouseEvent) => void;
}

const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(({
    userName,
    fullName,
    avatarUrl,
    size = 'md',
    className = '',
    disableLink = false,
    hasStory = false,
    isOnline = false,
    isLoading = false,
    onClick
}, ref) => {
    // State để xử lý lỗi khi link ảnh bị hỏng
    const [imgError, setImgError] = useState(false);

    // Chuẩn hóa kích thước
    const sizeMap = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-24 h-24 text-3xl',
        '2xl': 'w-32 h-32 text-4xl'
    };

    // Lấy 1-2 chữ cái đầu của tên nếu không có ảnh (VD: "Ngọc Như" -> "NN")
    const initials = useMemo(() => {
        if (!fullName && !userName) return 'U';
        const nameParts = (fullName || userName).trim().split(' ');
        if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        return (nameParts[0][0]).toUpperCase();
    }, [fullName, userName]);

    // Trạng thái Loading (Skeleton)
    if (isLoading) {
        return (
            <div
                ref={ref}
                className={`rounded-full bg-white/10 animate-pulse backdrop-blur-md ${sizeMap[size]} ${className}`}
            />
        );
    }

    // Viền Gradient nếu có Story (phong cách Instagram / InteractHub)
    const ringClasses = hasStory
        ? 'p-[3px] bg-gradient-to-tr from-[#FF1493] via-[#FF69B4] to-[#4F6BFF] hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(255,20,147,0.3)]'
        : 'p-[2px] border-2 border-white/10 hover:border-white/30 transition-colors duration-300 bg-[#1A1825]';

    const content = (
        <div className="relative inline-block cursor-pointer">
            {/* Vòng ngoài chứa Avatar */}
            <div
                ref={ref}
                onClick={onClick}
                className={`rounded-full overflow-hidden ${sizeMap[size]} ${ringClasses} ${className}`}
                title={fullName || userName}
            >
                <div className="w-full h-full bg-[#1A1825] rounded-full overflow-hidden flex items-center justify-center">
                    {avatarUrl && !imgError ? (
                        <img
                            src={avatarUrl}
                            alt={fullName}
                            // Thêm animate-fade-in để ảnh hiện ra mượt mà không bị giật
                            className="w-full h-full object-cover animate-fade-in"
                            loading="lazy"
                            onError={() => setImgError(true)} // Kích hoạt Fallback nếu lỗi
                        />
                    ) : (
                        // Fallback (Mesh Gradient style)
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm flex items-center justify-center">
                            <span className="font-bold bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] bg-clip-text text-transparent tracking-wider">
                                {initials}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chấm trạng thái Online */}
            {isOnline && (
                <span className="absolute bottom-0 right-0 w-[25%] h-[25%] min-w-[10px] min-h-[10px] bg-green-500 border-2 border-[#1A1825] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            )}
        </div>
    );

    if (disableLink) return content;

    return (
        <Link to={`/profile/${userName}`} className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1493] rounded-full">
            {content}
        </Link>
    );
});

// Memoize để tối ưu hiệu năng (không render lại avatar nếu props không đổi)
export default React.memo(UserAvatar);