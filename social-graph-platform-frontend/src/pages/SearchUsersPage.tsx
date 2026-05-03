// src/pages/SearchUsersPage.tsx

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, Users } from 'lucide-react';

import useSearchUsers from '../hooks/useSearchUsers';
import UserCard from '../components/user/UserCard';

const SearchUsersPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [inputValue, setInputValue] = useState(query);

    // Kỹ thuật React 18: Theo dõi sự thay đổi của query từ URL
    const [prevQuery, setPrevQuery] = useState(query);

    // Đồng bộ ô input khi URL thay đổi (VD: user bấm back/forward) NGAY TRONG RENDER PHASE
    if (query !== prevQuery) {
        setPrevQuery(query);
        setInputValue(query);
    }

    // Khởi tạo hook tìm kiếm với pageSize = 10
    const { users, isLoading, isLoadingMore, hasMore, search, loadMore } = useSearchUsers(10);

    // Kích hoạt tìm kiếm mỗi khi tham số 'q' trên URL thay đổi
    useEffect(() => {
        if (query.trim()) {
            search(query);
        }
    }, [query, search]);

    // Xử lý khi người dùng bấm Enter hoặc nút Tìm kiếm
    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (inputValue.trim()) {
            // Cập nhật tham số URL, useEffect ở trên sẽ tự động bắt được và gọi API
            setSearchParams({ q: inputValue.trim() });
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tiêu đề trang */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-[#4F6BFF]/10 rounded-2xl text-[#4F6BFF]">
                    <Users size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Khám phá mọi người</h1>
                    <p className="text-gray-400 mt-1 text-sm">Tìm kiếm bạn bè, đồng nghiệp trên mạng xã hội.</p>
                </div>
            </div>

            {/* Form Tìm kiếm (Glassmorphism) */}
            <form onSubmit={handleSearchSubmit} className="relative mb-10 group z-10">
                {/* Hiệu ứng Glow phía sau thanh tìm kiếm */}
                <div className="absolute inset-0 bg-[#4F6BFF] blur-[30px] opacity-10 group-hover:opacity-20 transition-opacity rounded-full"></div>

                <div className="relative flex items-center">
                    <Search size={24} className="absolute left-6 text-gray-400 group-focus-within:text-[#4F6BFF] transition-colors" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Nhập tên hoặc username bạn muốn tìm..."
                        className="w-full bg-[#1A1825]/90 backdrop-blur-md border border-white/10 rounded-full pl-16 pr-32 py-5 text-lg text-white focus:outline-none focus:border-[#4F6BFF]/50 focus:bg-[#12101A] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-3 px-6 py-2.5 bg-[#4F6BFF] hover:bg-[#3A54D6] text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#4F6BFF]/30 active:scale-95"
                    >
                        Tìm
                    </button>
                </div>
            </form>

            {/* Trạng thái Loading ban đầu */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 size={48} className="animate-spin text-[#4F6BFF]" />
                    <p className="text-gray-400 font-medium animate-pulse">Đang quét dữ liệu...</p>
                </div>
            )}

            {/* Danh sách kết quả */}
            {!isLoading && query && (
                <div className="space-y-4 relative z-0">
                    {users.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-gray-300 font-medium">
                                    Kết quả cho <span className="text-white font-bold tracking-wide">"{query}"</span>
                                </p>
                                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-gray-400">
                                    Hiển thị {users.length} người
                                </span>
                            </div>

                            <div className="space-y-3">
                                {users.map((user, index) => (
                                    <div
                                        key={user.id}
                                        className="animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                    >
                                        <UserCard user={user} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-[#1A1825]/40 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-gray-500" />
                            </div>
                            <h3 className="text-2xl text-white font-bold mb-2">Không có kết quả nào</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Chúng tôi không tìm thấy ai khớp với từ khóa "{query}". Hãy thử kiểm tra lại chính tả hoặc dùng một tên khác xem sao.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Nút Load More */}
            {!isLoading && hasMore && (
                <div className="mt-10 text-center">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="group px-8 py-3.5 bg-transparent hover:bg-white/5 border-2 border-white/10 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center gap-3 mx-auto active:scale-95"
                    >
                        {isLoadingMore ? (
                            <Loader2 size={20} className="animate-spin text-[#4F6BFF]" />
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {isLoadingMore ? 'Đang tải thêm...' : 'Hiển thị thêm kết quả'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchUsersPage;