// src/components/reaction/ReactionCount.tsx

import React from 'react';
import { getReactionConfig } from '../../utils/reactionIcons';
import type { ReactionCountDto } from '../../types/reaction';

interface ReactionCountProps {
    summary: ReactionCountDto;
    onClick?: () => void;
}

const ReactionCount: React.FC<ReactionCountProps> = ({ summary, onClick }) => {
    if (!summary || summary.totalReactions === 0) return null;

    // Lấy ra tối đa 3 loại cảm xúc xuất hiện nhiều nhất
    const topReactions = summary.reactions
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-lg transition-colors group select-none"
        >
            {/* Vùng Icon Overlapping */}
            <div className="flex items-center -space-x-1.5">
                {topReactions.map((r, index) => {
                    const config = getReactionConfig(r.type);
                    return (
                        <div
                            key={r.type}
                            className={`w-5 h-5 flex items-center justify-center rounded-full border border-[#0D0C13] shadow-sm z-[${3 - index}] relative`}
                            title={config.label}
                        >
                            <span className="text-[14px] drop-shadow-md">{config.emoji}</span>
                        </div>
                    );
                })}
            </div>

            {/* Số lượng */}
            <span className="text-[14px] font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                {summary.totalReactions.toLocaleString('vi-VN')}
            </span>
        </div>
    );
};

export default ReactionCount;