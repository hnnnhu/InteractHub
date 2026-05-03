// src/components/story/StoryTray.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useStoryFeed } from '../../hooks/story/useStoryFeed';
import { useStoryAutoRefresh } from '../../hooks/story/useStoryAutoRefresh';
import { StoryTrayItem } from './StoryTrayItem';
import type { ActiveStoryDto } from '../../types/story';

interface Props {
    onView?: (user: ActiveStoryDto) => void;
    onCreateStoryClick?: () => void;
    myStoryUser?: ActiveStoryDto | null;
}

export const StoryTray: React.FC<Props> = ({ onView, onCreateStoryClick, myStoryUser }) => {
    const { feed, loading, error, refresh } = useStoryFeed();
    useStoryAutoRefresh(refresh, 30000);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Lọc bỏ user hiện tại khỏi feed nếu myStoryUser đã hiển thị riêng
    const filteredFeed = myStoryUser
        ? feed.filter(user => user.userId !== myStoryUser.userId)
        : feed;

    const checkArrows = () => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeftArrow(el.scrollLeft > 0);
        setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        checkArrows();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkArrows, { passive: true });
            window.addEventListener('resize', checkArrows);
            return () => {
                el.removeEventListener('scroll', checkArrows);
                window.removeEventListener('resize', checkArrows);
            };
        }
    }, [filteredFeed]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (el) el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex gap-3 overflow-x-auto p-3 scrollbar-hide">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="shrink-0 snap-start">
                        <div className="flex flex-col items-center gap-1.5 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-white/[0.07]" />
                            <div className="w-12 h-3 bg-white/[0.07] rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={18} />
                    <span>Không tải được story</span>
                </div>
                <button onClick={refresh} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-full">
                    <RefreshCw size={16} />
                </button>
            </div>
        );
    }

    const hasMyStories = myStoryUser && myStoryUser.stories.length > 0;
    const hasFriendsStories = filteredFeed.length > 0;

    return (
        <div className="relative group/tray">
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity opacity-0 group-hover/tray:opacity-100"
                >
                    <ChevronLeft size={20} />
                </button>
            )}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity opacity-0 group-hover/tray:opacity-100"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto p-3 scroll-smooth scrollbar-hide snap-x snap-mandatory"
            >
                {/* Nút tạo story */}
                <div className="shrink-0 snap-start">
                    <div
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                        onClick={onCreateStoryClick}
                        role="button"
                        tabIndex={0}
                        aria-label="Tạo story mới"
                    >
                        <div className="relative w-16 h-16">
                            <div className="w-full h-full rounded-full p-[2.5px] bg-gradient-to-br from-[#4F6BFF] to-[#7B5AFF] group-hover:shadow-[0_0_15px_rgba(79,107,255,0.4)] transition-shadow">
                                <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center">
                                    <Camera className="w-7 h-7 text-[#8E8E93] group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-[#8E8E93] group-hover:text-white transition-colors w-16 text-center truncate">
                            Tạo story
                        </span>
                    </div>
                </div>

                {/* Story của bạn (nếu có) */}
                {hasMyStories && (
                    <div className="shrink-0 snap-start">
                        <StoryTrayItem
                            activeStory={myStoryUser}
                            onView={onView}
                            isOwn={true}
                        />
                    </div>
                )}

                {/* Story bạn bè (đã lọc bỏ chính mình) */}
                {hasFriendsStories ? (
                    filteredFeed.map(user => (
                        <div key={user.userId} className="shrink-0 snap-start">
                            <StoryTrayItem activeStory={user} onView={onView} />
                        </div>
                    ))
                ) : (
                    <div className="shrink-0 snap-start flex items-center">
                        <div className="flex flex-col items-center justify-center gap-1 px-4 py-2 bg-[#1C1C1E] border border-dashed border-white/[0.07] rounded-2xl text-center">
                            <span className="text-xs text-[#8E8E93]">Chưa có story từ bạn bè</span>
                            <span className="text-[10px] text-[#6E6E73]">Hãy kết nối thêm bạn bè để xem story của họ</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};