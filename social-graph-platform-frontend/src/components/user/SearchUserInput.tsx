// src/components/user/SearchUserInput.tsx

import React, { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import userApi from '../../api/userApi';
import UserCard from './UserCard';
import type { UserSummaryDto } from '../../types/user';

const SearchUserInput: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSummaryDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Xử lý logic thay đổi text trực tiếp tại Event Handler
    const handleQueryChange = (text: string) => {
        setQuery(text);

        // Nếu text rỗng, lập tức xóa kết quả và đóng dropdown 
        // (Không cần chờ useEffect, tránh cascading render)
        if (!text.trim()) {
            setResults([]);
            setIsOpen(false);
        }
    };

    // Debounce Search Logic: Chỉ chạy khi query có dữ liệu
    useEffect(() => {
        if (!query.trim()) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await userApi.searchUsers({ keyword: query, pageNumber: 1, pageSize: 5 });
                if (res.isSuccess && res.data) {
                    setResults(res.data.items);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Đợi 500ms sau khi ngừng gõ mới gọi API

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="relative w-full max-w-sm z-50">
            {/* Input thanh tìm kiếm */}
            <div className="relative group">
                <Search size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? 'text-[#4F6BFF]' : 'text-gray-500 group-hover:text-white'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Tìm kiếm người dùng..."
                    className="w-full bg-[#1A1825] border border-white/10 rounded-full pl-12 pr-10 py-2.5 text-[15px] text-white focus:outline-none focus:border-[#4F6BFF] focus:bg-[#12101A] transition-all shadow-inner"
                />

                {isSearching ? (
                    <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4F6BFF] animate-spin" />
                ) : query && (
                    <button
                        onClick={() => handleQueryChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Dropdown kết quả */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#12101A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar space-y-1">
                        {results.length > 0 ? (
                            results.map(user => (
                                <div key={user.id} onClick={() => setIsOpen(false)}>
                                    <UserCard user={user} />
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-400 font-medium text-sm">
                                Không tìm thấy ai tên "{query}"
                            </div>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="p-3 border-t border-white/10 text-center">
                            <span className="text-[#4F6BFF] text-sm font-bold cursor-pointer hover:text-white transition-colors">Xem tất cả kết quả</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchUserInput;