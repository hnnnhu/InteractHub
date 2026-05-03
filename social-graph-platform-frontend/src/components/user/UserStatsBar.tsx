// src/components/user/UserStatsBar.tsx
import React, { useMemo } from 'react';
import { FileText, Users, PlaySquare, Bookmark } from 'lucide-react';
import type { UserStatsDto } from '../../types/user';

interface UserStatsBarProps {
    stats?: UserStatsDto | null;
    /** Cho phép ẩn một số cột nếu xem ở chế độ rút gọn (vd: không hiện Đã lưu của người khác) */
    hideSavedPosts?: boolean;
}

const UserStatsBar: React.FC<UserStatsBarProps> = ({ stats, hideSavedPosts = false }) => {
    // 🚀 ĐƯA HOOK LÊN TRÊN CÙNG: React bắt buộc gọi Hooks trước mọi lệnh return (early return)
    const statItems = useMemo(() => {
        // Bảo vệ an toàn: Nếu stats null, trả về mảng rỗng để không bị lỗi "Cannot read property 'postCount' of null"
        if (!stats) return [];

        const items = [
            {
                label: 'Bài viết',
                count: stats.postCount,
                icon: FileText,
                color: 'text-[#4F6BFF]',
                bgGlow: 'group-hover:shadow-[0_0_15px_rgba(79,107,255,0.4)]'
            },
            {
                label: 'Bạn bè',
                count: stats.friendCount,
                icon: Users,
                color: 'text-[#00FF9F]',
                bgGlow: 'group-hover:shadow-[0_0_15px_rgba(0,255,159,0.4)]'
            },
            {
                label: 'Story',
                count: stats.storyCount,
                icon: PlaySquare,
                color: 'text-[#FF1493]',
                bgGlow: 'group-hover:shadow-[0_0_15px_rgba(255,20,147,0.4)]'
            },
        ];

        // Chỉ thêm mục "Đã lưu" nếu không bị ẩn
        if (!hideSavedPosts) {
            items.push({
                label: 'Đã lưu',
                count: stats.savedPostCount,
                icon: Bookmark,
                color: 'text-[#FFB800]',
                bgGlow: 'group-hover:shadow-[0_0_15px_rgba(255,184,0,0.4)]'
            });
        }

        return items;
    }, [stats, hideSavedPosts]);

    // 🚀 ĐẶT LỆNH KIỂM TRA Ở ĐÂY: Sau khi tất cả các Hooks đã được khai báo xong
    if (!stats) return null;

    /**
     * Format số lượng (VD: 1.500, 10K, 1M) để tránh vỡ giao diện khi số quá lớn
     */
    const formatCount = (count: number) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 10000) return (count / 1000).toFixed(1) + 'K';
        return count.toLocaleString('vi-VN');
    };

    return (
        <div className="w-full flex items-center justify-around sm:justify-center sm:gap-12 p-5 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            {statItems.map((item, idx) => (
                <div
                    key={idx}
                    className="flex flex-col items-center justify-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                    title={`${item.count.toLocaleString('vi-VN')} ${item.label}`}
                >
                    {/* Icon Container with Glow Effect */}
                    <div className={`p-2 sm:p-2.5 rounded-2xl bg-white/5 border border-white/5 mb-2 transition-all duration-300 ${item.bgGlow}`}>
                        <item.icon size={18} className={`${item.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                    </div>

                    {/* Con số */}
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight mb-0.5">
                        {formatCount(item.count)}
                    </span>

                    {/* Nhãn */}
                    <span className="text-[11px] sm:text-[12px] text-gray-400 font-semibold tracking-wider uppercase group-hover:text-gray-200 transition-colors">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default React.memo(UserStatsBar);