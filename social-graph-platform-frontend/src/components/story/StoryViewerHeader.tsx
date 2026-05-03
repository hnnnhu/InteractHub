// src/components/story/StoryViewerHeader.tsx
import React from 'react';
import { X, Eye } from 'lucide-react';

interface StoryViewerHeaderProps {
    avatarUrl: string;
    fullName: string;
    timeText: string;
    onClose: () => void;
    onViewersClick?: () => void;
    viewCount?: number;
}

export const StoryViewerHeader: React.FC<StoryViewerHeaderProps> = ({
    avatarUrl,
    fullName,
    timeText,
    onClose,
    onViewersClick,
    viewCount,
}) => {
    return (
        <div className="flex items-center justify-between w-full text-white">
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-10 h-10 shrink-0">
                    <img
                        src={avatarUrl || '/default-avatar.png'}
                        alt={fullName}
                        className="w-full h-full rounded-full object-cover border-2 border-white/30 shadow-lg"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                    />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate drop-shadow-md">
                        {fullName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="truncate">{timeText}</span>
                        {viewCount !== undefined && (
                            <button
                                onClick={onViewersClick}
                                className="flex items-center gap-1 hover:text-white transition-colors underline-offset-2 hover:underline whitespace-nowrap"
                                title="Danh sách người xem"
                            >
                                <Eye size={14} />
                                <span>{viewCount}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
                {onViewersClick && (
                    <button
                        onClick={onViewersClick}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Danh sách người xem"
                        title="Danh sách người xem"
                    >
                        <Eye size={20} />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Đóng story"
                >
                    <X size={22} />
                </button>
            </div>
        </div>
    );
};