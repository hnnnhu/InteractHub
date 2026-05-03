// src/components/reaction/ReactionButton.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react'; // Icon mặc định khi chưa thích
import { getReactionConfig } from '../../utils/reactionIcons';
import useReaction from '../../hooks/useReaction';
import ReactionPicker from './ReactionPicker';
import type { ReactionType, ReactionCountDto } from '../../types/reaction';

interface ReactionButtonProps {
    postId: string;
    currentUserReaction?: ReactionType | null;
    onReactionChange: (newSummary?: ReactionCountDto) => void;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({ postId, currentUserReaction, onReactionChange }) => {
    const [showPicker, setShowPicker] = useState(false);

    // [ĐÃ FIX]: Sử dụng ReturnType<typeof setTimeout> thay vì NodeJS.Timeout
    // Điều này giúp code chạy mượt mà trên trình duyệt mà TypeScript không bị bối rối.
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { toggleReaction, removeReaction, isMutating } = useReaction(postId);

    // Lấy cấu hình của cảm xúc hiện tại (Nếu chưa có thì trả về null/mặc định)
    const currentConfig = currentUserReaction ? getReactionConfig(currentUserReaction) : null;

    // Xử lý Hover Delay (Mượt mà như Facebook)
    const handleMouseEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setShowPicker(true), 400); // Đợi 400ms mới hiện
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setShowPicker(false), 300);
    };

    // Xử lý Click trực tiếp vào nút (Toggle Like mặc định hoặc Gỡ)
    const handleButtonClick = async () => {
        if (isMutating) return;

        if (currentUserReaction) {
            // Đã có cảm xúc -> Gỡ
            await removeReaction(() => onReactionChange());
        } else {
            // Chưa có -> Mặc định là Like (Id = 1)
            await toggleReaction(1 as ReactionType, (newSum) => onReactionChange(newSum));
        }
        setShowPicker(false);
    };

    // Xử lý chọn từ Picker
    const handleSelectReaction = async (type: ReactionType) => {
        if (isMutating) return;
        setShowPicker(false);
        await toggleReaction(type, (newSum) => onReactionChange(newSum));
    };

    // Cleanup timeout để tránh rò rỉ bộ nhớ (memory leak) khi unmount
    useEffect(() => {
        return () => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        };
    }, []);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {showPicker && <ReactionPicker onSelect={handleSelectReaction} onMouseLeave={() => setShowPicker(false)} />}

            <button
                onClick={handleButtonClick}
                disabled={isMutating}
                className="flex items-center gap-2 group transition-colors relative"
            >
                <div className={`p-2 rounded-full transition-colors ${currentConfig ? currentConfig.bgColor : 'group-hover:bg-white/5'}`}>
                    {isMutating ? (
                        <Loader2 size={26} className="animate-spin text-gray-400" />
                    ) : currentConfig ? (
                        // Hiện icon theo cảm xúc đã chọn
                        <currentConfig.Icon
                            size={26}
                            className={`transition-all duration-300 scale-110 fill-current ${currentConfig.textColor} ${currentConfig.shadowColor}`}
                        />
                    ) : (
                        // Mặc định (Chưa thích)
                        <Heart size={26} className="text-gray-400 group-hover:text-white transition-all duration-300 group-hover:scale-110" />
                    )}
                </div>

                {/* Chữ hiển thị kế bên (Thích, Yêu thích...) */}
                <span className={`font-bold text-[15px] select-none transition-colors hidden sm:block ${currentConfig ? currentConfig.textColor : 'text-gray-400 group-hover:text-white'}`}>
                    {currentConfig ? currentConfig.label : 'Thích'}
                </span>
            </button>
        </div>
    );
};

export default ReactionButton;