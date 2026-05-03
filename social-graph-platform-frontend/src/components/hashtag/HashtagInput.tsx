// src/components/hashtag/HashtagInput.tsx

import React, { useRef, useEffect, useState } from 'react';
import { X, Hash, Loader2 } from 'lucide-react';
import { useHashtagSearch } from '../../hooks/useHashtagSearch'; // Hook bạn đã viết ở bước trước

interface HashtagInputProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
    className?: string;
}

export const HashtagInput: React.FC<HashtagInputProps> = ({
    selectedTags,
    onChange,
    maxTags = 10,
    placeholder = "Thêm hashtag...",
    className = ''
}) => {
    const { keyword, setKeyword, hashtags, loading } = useHashtagSearch(5);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Click outside để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddTag = (tagName: string) => {
        const cleanName = tagName.replace(/^#/, '').trim().toLowerCase();
        if (!cleanName) return;

        if (selectedTags.length >= maxTags) {
            alert(`Bạn chỉ được thêm tối đa ${maxTags} hashtag.`);
            return;
        }

        if (!selectedTags.includes(cleanName)) {
            onChange([...selectedTags, cleanName]);
        }

        setKeyword(''); // Clear input
        inputRef.current?.focus(); // Giữ focus lại vào ô input
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(keyword);
        } else if (e.key === 'Backspace' && keyword === '' && selectedTags.length > 0) {
            // Nhấn backspace khi input trống sẽ xóa tag cuối cùng
            handleRemoveTag(selectedTags[selectedTags.length - 1]);
        }
    };

    const showDropdown = isFocused && keyword.trim().length > 0;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Input Wrapper (Trông như một ô Textarea/Input bọc lấy các chips) */}
            <div
                className={`min-h-[46px] p-2 flex flex-wrap gap-2 items-center bg-gray-50 border rounded-lg transition-colors cursor-text
                    ${isFocused ? 'border-blue-500 bg-white ring-2 ring-blue-100' : 'border-gray-200 hover:bg-gray-100'}`}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Hiển thị các tags đã chọn (Chips) */}
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className="flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                    >
                        <Hash className="w-3 h-3 mr-0.5 opacity-60" />
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag);
                            }}
                            className="ml-1.5 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Ô input chính */}
                <input
                    ref={inputRef}
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    placeholder={selectedTags.length < maxTags ? placeholder : ''}
                    disabled={selectedTags.length >= maxTags}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Dropdown Gợi ý (Auto-complete) */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-4 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-sm">Đang tìm kiếm...</span>
                        </div>
                    ) : hashtags.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto py-1">
                            {hashtags.map(tag => (
                                <li
                                    key={tag.id}
                                    onClick={() => handleAddTag(tag.name)}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors"
                                >
                                    <span className="font-medium text-gray-800 flex items-center">
                                        <Hash className="w-4 h-4 text-gray-400 mr-1.5" />
                                        {tag.name}
                                    </span>
                                    <span className="text-xs text-gray-500">{tag.usageCount} bài viết</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        // Nếu không tìm thấy, gợi ý người dùng tạo mới
                        <div
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-600 flex items-center"
                            onClick={() => handleAddTag(keyword)}
                        >
                            <span className="bg-gray-100 p-1 rounded mr-2 text-gray-500"><Hash className="w-3 h-3" /></span>
                            Tạo hashtag mới <span className="font-bold text-blue-600 ml-1">#{keyword.replace(/^#/, '')}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HashtagInput;