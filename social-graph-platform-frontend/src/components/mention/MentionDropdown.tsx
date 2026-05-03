// src/components/mention/MentionDropdown.tsx
import React, { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useMentionSearch } from '../../hooks/useMentionSearch';
import type { UserSummaryDto } from '../../types/user';

interface MentionDropdownProps {
    keyword: string;
    position: { top: number; left: number };
    onSelect: (username: string) => void;
    onClose: () => void;
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
    keyword,
    position,
    onSelect,
    onClose,
}) => {
    const { data: users, isLoading, isError } = useMentionSearch(keyword);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    // Đóng dropdown khi click bên ngoài (bên trong dropdown tự xử lý)
    useOutsideClick(dropdownRef, onClose);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!users || users.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev < users.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : users.length - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < users.length) {
                    onSelect(users[activeIndex].userName);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [users, activeIndex, onSelect, onClose],
    );

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-[#4F6BFF]/30 text-white rounded-sm px-0.5">
                            {part}
                        </mark>
                    ) : (
                        part
                    ),
                )}
            </>
        );
    };

    const noResults = !isLoading && !isError && users && users.length === 0;

    return (
        <div
            ref={dropdownRef}
            data-mention-dropdown   // ← THÊM ATTRIBUTE NÀY để nhận biết dropdown đến từ mention
            className="fixed z-50 w-72 max-h-64 overflow-y-auto custom-scrollbar bg-[#1A1825]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{ top: position.top, left: position.left }}
            onKeyDown={handleKeyDown}
        >
            {isLoading && (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-[#4F6BFF] animate-spin" />
                    <span className="ml-2 text-sm text-gray-400">Đang tìm...</span>
                </div>
            )}

            {isError && (
                <div className="px-4 py-3 text-sm text-red-400 text-center">Lỗi khi tải gợi ý</div>
            )}

            {noResults && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                    Không tìm thấy người dùng
                </div>
            )}

            {users && users.length > 0 && (
                <ul className="py-1">
                    {users.map((user: UserSummaryDto, index: number) => (
                        <li key={user.id}>
                            <button
                                type="button"
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === activeIndex
                                        ? 'bg-[#4F6BFF]/10 border-l-2 border-[#4F6BFF]'
                                        : 'hover:bg-white/5'
                                    }`}
                                onClick={() => {
                                    onSelect(user.userName);
                                    onClose();
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/10 border border-white/5">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#FF1493] font-bold text-sm">
                                            {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className="text-white font-medium text-sm truncate">
                                        {highlightMatch(user.fullName, keyword)}
                                    </span>
                                    <span className="text-gray-400 text-xs truncate">
                                        @{highlightMatch(user.userName, keyword)}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!keyword && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Nhập tên người dùng...
                </div>
            )}
        </div>
    );
};

// Hook xử lý click outside
function useOutsideClick(ref: React.RefObject<HTMLElement>, onClose: () => void) {
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, onClose]);
}

export default MentionDropdown;