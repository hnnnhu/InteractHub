// src/pages/HashtagSearch.tsx

import React from 'react';
import { Search, Hash, Loader2 } from 'lucide-react';
import { useHashtagSearch } from '../hooks/useHashtagSearch';
import TrendingHashtags from '../components/hashtag/TrendingHashtags';
import HashtagLink from '../components/hashtag/HashtagLink';

export const HashtagSearch: React.FC = () => {
    const { keyword, setKeyword, hashtags, loading, hasMore, loadMore } = useHashtagSearch(15);

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                {/* Hero Search Section - Giao diện Gradient Dark */}
                <div className="relative overflow-hidden bg-[#0D0C13]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 mb-8 shadow-xl">
                    {/* Hiệu ứng ánh sáng nền mờ ảo */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4F6BFF]/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FF1493]/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">Khám phá Cộng đồng</h1>
                        <p className="text-gray-400 mb-8 text-lg">Tìm kiếm các chủ đề, sự kiện và xu hướng đang diễn ra.</p>

                        <div className="relative max-w-2xl">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-6 w-6 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="block w-full pl-14 pr-4 py-4 rounded-full bg-[#1A1825] border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#4F6BFF] focus:border-transparent transition-all shadow-inner"
                                placeholder="Nhập từ khóa hoặc #hashtag..."
                            />
                        </div>
                    </div>
                </div>

                {/* Kết quả tìm kiếm */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                            <Hash className="w-5 h-5 text-gray-300" />
                        </div>
                        {keyword.trim() === '' ? 'Tất cả Hashtag' : `Kết quả cho "${keyword}"`}
                    </h2>

                    {hashtags.length === 0 && !loading ? (
                        <div className="py-16 text-center bg-[#0D0C13]/80 border border-white/10 rounded-[2rem]">
                            <p className="text-gray-500 text-lg">Không tìm thấy hashtag nào phù hợp.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hashtags.map((tag) => (
                                <div key={tag.id} className="bg-[#0D0C13]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group flex flex-col justify-between">
                                    <div>
                                        {/* Ghi đè class mặc định của HashtagLink để phù hợp với Card */}
                                        <HashtagLink
                                            name={tag.name}
                                            className="text-lg font-bold text-white group-hover:text-[#4F6BFF] truncate block no-underline hover:no-underline"
                                        />
                                    </div>
                                    <div className="mt-5 flex justify-between items-end">
                                        <span className="text-xs font-medium text-[#4F6BFF] bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 px-3 py-1.5 rounded-md">
                                            {tag.usageCount} bài viết
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin" />
                        </div>
                    )}

                    {hasMore && !loading && hashtags.length > 0 && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={loadMore}
                                className="px-8 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 transition-all"
                            >
                                Tải thêm kết quả
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-[320px] flex-shrink-0">
                <div className="sticky top-24">
                    <TrendingHashtags limit={10} />
                </div>
            </div>
        </div>
    );
};

export default HashtagSearch;