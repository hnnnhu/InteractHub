// src/components/reaction/ReactionPicker.tsx

import React from 'react';
import { getAllReactions } from '../../utils/reactionIcons';
import type { ReactionType } from '../../types/reaction';

interface ReactionPickerProps {
    onSelect: (type: ReactionType) => void;
    onMouseLeave?: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onMouseLeave }) => {
    const reactions = getAllReactions();

    return (
        <div
            onMouseLeave={onMouseLeave}
            className="absolute bottom-full left-0 mb-2 p-1.5 flex items-center gap-1.5 bg-[#12101A]/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
            {reactions.map((config) => (
                <button
                    key={config.type}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(config.type);
                    }}
                    className={`relative group p-2.5 rounded-full transition-all duration-300 hover:bg-white/10 ${config.hoverAnimation}`}
                    title={config.label}
                >
                    {/* Hiển thị Emoji (Dùng cho tươi sáng) */}
                    <span className={`text-2xl drop-shadow-md group-hover:${config.shadowColor} transition-all`}>
                        {config.emoji}
                    </span>

                    {/* Tooltip nhỏ hiện tên cảm xúc ở trên */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[11px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {config.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default ReactionPicker;