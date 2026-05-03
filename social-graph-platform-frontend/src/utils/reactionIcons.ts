// src/utils/reactionIcons.tsx

import React from 'react';
import { ThumbsUp, Heart, Smile, Zap, Frown, Flame } from 'lucide-react';
import { ReactionType } from '../types/reaction';

export interface ReactionConfig {
    type: ReactionType;
    label: string;
    /** Emoji native để hiển thị rực rỡ trên thanh popup thả cảm xúc */
    emoji: string;
    /** Icon Lucide dùng cho các giao diện tĩnh hoặc fallback */
    Icon: React.ElementType;
    /** Màu chữ chính */
    textColor: string;
    /** Màu nền nhạt (dùng cho hover hoặc background button) */
    bgColor: string;
    /** Hiệu ứng bóng đổ phát sáng (Glow Effect) */
    shadowColor: string;
    /** Hiệu ứng Animation khi Hover vào (Tailwind classes) */
    hoverAnimation: string;
}

/**
 * Bản đồ cấu hình toàn bộ Cảm xúc của hệ thống.
 * Được thiết kế đồng bộ với hệ màu Neon/Dark mode hiện tại.
 */
export const REACTION_MAP: Record<ReactionType, ReactionConfig> = {
    [ReactionType.Like]: {
        type: ReactionType.Like,
        label: 'Thích',
        emoji: '👍',
        Icon: ThumbsUp,
        textColor: 'text-[#4F6BFF]', // Xanh Neon
        bgColor: 'bg-[#4F6BFF]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(79,107,255,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    },
    [ReactionType.Love]: {
        type: ReactionType.Love,
        label: 'Yêu thích',
        emoji: '❤️',
        Icon: Heart,
        textColor: 'text-[#FF1493]', // Hồng Deep Pink
        bgColor: 'bg-[#FF1493]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(255,20,147,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    },
    [ReactionType.Haha]: {
        type: ReactionType.Haha,
        label: 'Haha',
        emoji: '😂',
        Icon: Smile,
        textColor: 'text-[#FFD700]', // Vàng Gold
        bgColor: 'bg-[#FFD700]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    },
    [ReactionType.Wow]: {
        type: ReactionType.Wow,
        label: 'Wow',
        emoji: '😲',
        Icon: Zap,
        textColor: 'text-[#00FF9F]', // Xanh Mint
        bgColor: 'bg-[#00FF9F]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(0,255,159,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    },
    [ReactionType.Sad]: {
        type: ReactionType.Sad,
        label: 'Buồn',
        emoji: '😢',
        Icon: Frown,
        textColor: 'text-[#9D4EDD]', // Tím Purple
        bgColor: 'bg-[#9D4EDD]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(157,78,221,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    },
    [ReactionType.Angry]: {
        type: ReactionType.Angry,
        label: 'Phẫn nộ',
        emoji: '😡',
        Icon: Flame,
        textColor: 'text-[#FF4500]', // Đỏ Cam
        bgColor: 'bg-[#FF4500]/10',
        shadowColor: 'drop-shadow-[0_0_12px_rgba(255,69,0,0.8)]',
        hoverAnimation: 'hover:scale-125 hover:-translate-y-2 transition-all duration-300'
    }
};

// ==========================================
// CÁC HÀM HELPER (TIỆN ÍCH)
// ==========================================

/**
 * Lấy cấu hình chi tiết của một loại cảm xúc.
 * @param type Loại cảm xúc (ReactionType)
 * @returns Cấu hình chi tiết, hoặc cấu hình mặc định (Like) nếu không tìm thấy.
 */
export const getReactionConfig = (type: ReactionType | null | undefined): ReactionConfig => {
    if (!type || !REACTION_MAP[type]) {
        return REACTION_MAP[ReactionType.Like]; // Fallback an toàn
    }
    return REACTION_MAP[type];
};

/**
 * Trả về mảng tất cả các cấu hình cảm xúc (Dùng để render thanh chọn cảm xúc - Reaction Toolbar)
 */
export const getAllReactions = (): ReactionConfig[] => {
    return Object.values(REACTION_MAP);
};