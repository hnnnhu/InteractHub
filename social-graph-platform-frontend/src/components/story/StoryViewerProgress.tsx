// src/components/story/StoryViewerProgress.tsx
import React from 'react';

interface Props {
    /** Thanh tiến trình đang được phát */
    active: boolean;
    /** Phần trăm hoàn thành (0-100) */
    progress: number;
    /** Story đang bị tạm dừng (giữ màn hình) */
    paused?: boolean;
    /** Story đã được xem trước đó (đã kết thúc) */
    viewed?: boolean;
}

/**
 * Thanh tiến trình của một story – phong cách Instagram.
 * Hỗ trợ các trạng thái: đang phát, đã xem, tạm dừng, chưa xem.
 */
export const StoryViewerProgress: React.FC<Props> = ({
    active,
    progress,
    paused = false,
    viewed = false,
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Xác định kiểu dáng dựa trên trạng thái
    const trackStyle = viewed
        ? 'bg-white/30'                 // story đã xem: nền mờ hơn
        : active
            ? 'bg-white/20'                // đang active: nền sáng nhẹ
            : 'bg-white/10';               // chưa active: nền rất mờ

    const barStyle = viewed
        ? 'bg-white/60'                // đã xem: thanh màu trắng nhạt
        : paused
            ? 'bg-white/70'                // đang tạm dừng: thanh hơi đục
            : 'bg-white';                  // bình thường: trắng hoàn toàn

    return (
        <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden transition-colors duration-300 ${trackStyle}`}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Story progress ${clampedProgress}%`}
        >
            <div
                className={`h-full rounded-full transition-[width] duration-75 ease-linear ${barStyle}`}
                style={{ width: `${clampedProgress}%` }}
            />
        </div>
    );
};