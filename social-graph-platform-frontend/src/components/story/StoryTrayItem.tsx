// src/components/story/StoryTrayItem.tsx
import React from 'react';
import type { ActiveStoryDto } from '../../types/story';

export interface StoryTrayItemProps {
    activeStory: ActiveStoryDto;
    onView?: (user: ActiveStoryDto) => void;
    /** Đánh dấu đây là story của chính mình */
    isOwn?: boolean;
}

export const StoryTrayItem: React.FC<StoryTrayItemProps> = ({
    activeStory,
    onView,
    isOwn = false,
}) => {
    const { fullName, avatarUrl, unviewedCount, stories } = activeStory;
    const hasUnviewed = !isOwn && unviewedCount > 0;
    const badgeCount = isOwn ? stories.length : unviewedCount;

    return (
        <div
            className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            onClick={() => onView?.(activeStory)}
            role="button"
            tabIndex={0}
            aria-label={`Xem story của ${fullName}`}
        >
            <div className="relative w-16 h-16">
                <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${hasUnviewed || isOwn
                            ? 'p-[3px] bg-gradient-to-br from-[#FF1493] via-[#FF4B6A] to-[#FFB800] shadow-lg shadow-[#FF1493]/20 group-hover:shadow-[#FF1493]/40 group-hover:scale-105'
                            : 'p-[3px] bg-[#4B5563] opacity-40 group-hover:opacity-60'
                        }`}
                >
                    <div className="w-full h-full rounded-full bg-[#1C1C1E] p-[2px]">
                        <img
                            src={avatarUrl || '/default-avatar.png'}
                            alt={fullName}
                            className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                        />
                    </div>
                </div>
                {badgeCount > 0 && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#4F6BFF] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none shadow-[0_0_8px_rgba(79,107,255,0.6)] border-2 border-[#1C1C1E] z-10">
                        {badgeCount}
                    </span>
                )}
            </div>
            <span
                className={`text-xs w-16 truncate text-center transition-colors ${hasUnviewed || isOwn
                        ? 'text-white font-medium'
                        : 'text-[#8E8E93] group-hover:text-gray-300'
                    }`}
            >
                {isOwn ? 'Của bạn' : fullName}
            </span>
        </div>
    );
};