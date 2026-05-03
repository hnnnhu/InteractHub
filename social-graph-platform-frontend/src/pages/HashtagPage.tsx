// src/pages/HashtagPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { hashtagApi, type HashtagWithPostsDto } from '../api/hashtagApi';
import type { PostSummaryDto } from '../api/postApi';
import TrendingHashtags from '../components/hashtag/TrendingHashtags';
import PostCard from '../components/feed/PostCard';

export const HashtagPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<HashtagWithPostsDto | null>(null);
    const [posts, setPosts] = useState<PostSummaryDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const fetchInitialData = async () => {
            if (!name) return;
            setLoading(true);
            setError(null);

            try {
                const res = await hashtagApi.getHashtagWithPosts(name, 1, 10);
                if (!isMounted) return;

                if (res.isSuccess && res.data) {
                    setData(res.data);
                    setPosts(res.data.posts);
                    setPage(1);
                    setHasMore(res.data.posts.length === 10);
                } else {
                    setError('Không tìm thấy hashtag này.');
                }
            } catch {
                if (isMounted) setError('Đã xảy ra lỗi khi tải dữ liệu.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchInitialData();
        return () => { isMounted = false; };
    }, [name]);

    const handleLoadMore = async () => {
        if (loading || !hasMore || !name) return;

        const nextPage = page + 1;
        setLoading(true);

        try {
            const res = await hashtagApi.getHashtagWithPosts(name, nextPage, 10);
            if (res.isSuccess && res.data) {
                setPosts(prev => [...prev, ...res.data.posts]);
                setPage(nextPage);
                setHasMore(res.data.posts.length === 10);
            }
        } catch {
            setError('Đã xảy ra lỗi khi tải thêm dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    // Nếu lỗi, vẫn phải có pt-[100px] để không bị Topbar đè
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center w-full pt-[100px] px-4">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
                    <Hash className="w-12 h-12 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Hashtag không tồn tại</h2>
                <p className="text-gray-400 mt-3">{error}</p>
                <button onClick={() => navigate(-1)} className="mt-8 px-8 py-3 bg-[#4F6BFF] text-white font-medium rounded-full hover:bg-[#4F6BFF]/80 transition-all shadow-[0_0_20px_rgba(79,107,255,0.3)]">
                    Quay lại Bảng tin
                </button>
            </div>
        );
    }

    return (
        // ĐÃ FIX: pt-[100px] (Dành chỗ cho 76px Topbar + 24px khoảng trống)
        <div className="w-full max-w-[1150px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start pt-[100px] px-4 lg:px-8 pb-20">

            {/* Cột Chính: Thông tin & Danh sách bài viết */}
            <div className="flex-1 min-w-0 w-full flex flex-col gap-6">

                {/* --- CARD HEADER HASHTAG --- */}
                <div className="bg-[#0D0C13]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden group">
                    {/* Ánh sáng glow đa tầng siêu mượt */}
                    <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#4F6BFF]/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 group-hover:bg-[#4F6BFF]/30"></div>
                    <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-[#FF1493]/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors w-max relative z-10"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
                    </button>

                    <div className="flex items-center gap-5 md:gap-6 relative z-10">
                        {/* Biểu tượng Hashtag nổi bật */}
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#1A1825] to-[#0D0C13] rounded-[1.5rem] flex items-center justify-center flex-shrink-0 border border-[#4F6BFF]/30 shadow-[0_0_30px_rgba(79,107,255,0.2)]">
                            <Hash className="w-10 h-10 md:w-12 md:h-12 text-[#4F6BFF]" />
                        </div>

                        <div className="flex flex-col justify-center">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white break-words tracking-tight mb-3">
                                {data?.name || name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm md:text-base text-gray-300 bg-white/5 w-max px-3.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                <span className="text-white font-bold">{data?.usageCount || 0}</span>
                                <span>bài viết đang tham gia thảo luận</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FEED BÀI VIẾT --- */}
                <div className="flex flex-col gap-6 relative z-10">
                    {posts.length === 0 && !loading ? (
                        <div className="bg-[#0D0C13]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 text-center flex flex-col items-center shadow-lg">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/5">
                                <FileText className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="text-gray-300 text-lg font-medium">Chưa có bài viết nào sử dụng hashtag này.</p>
                            <p className="text-gray-500 mt-2 text-sm">Hãy là người đầu tiên khơi mào cuộc trò chuyện!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))
                    )}

                    {/* Nút Tải thêm */}
                    {hasMore && posts.length > 0 && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="w-full py-4 bg-[#1A1825] hover:bg-[#252236] border border-white/10 text-white font-medium rounded-[1.5rem] transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-md"
                        >
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2 text-[#4F6BFF]" /> Đang xử lý...</> : 'Tải thêm bài viết'}
                        </button>
                    )}
                </div>
            </div>

            {/* Cột Phụ: Sidebar Trending */}
            <div className="w-full lg:w-[320px] xl:w-[340px] flex-shrink-0">
                {/* ĐÃ FIX STICKY: top-[100px] an toàn, không cấn Topbar */}
                <div className="sticky top-[100px] flex flex-col gap-6">
                    <TrendingHashtags limit={7} />

                    <div className="px-4 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-2 font-medium">
                        <span className="hover:text-gray-300 transition-colors cursor-pointer">Quyền riêng tư</span>
                        <span className="hover:text-gray-300 transition-colors cursor-pointer">Điều khoản</span>
                        <span className="hover:text-gray-300 transition-colors cursor-pointer">Cookie</span>
                        <span>© 2026 Social Graph</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HashtagPage;