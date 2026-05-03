// src/pages/SearchPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    FileText,
    Hash,
    Loader2,
    Users,
    AlertCircle,
    LayoutGrid,
    Sparkles
} from 'lucide-react';

// Import các API và types từ hệ thống
import { postApi } from '../api/postApi';
import { userApi } from '../api/userApi';
import { hashtagApi, type HashtagDto } from '../api/hashtagApi';
import type { UserSummaryDto } from '../types/user';
import type { PostSummaryDto } from '../api/postApi';

// Tái sử dụng PostCard hoàn chỉnh của hệ thống
import PostCard from '../components/feed/PostCard';

type SearchTab = 'all' | 'users' | 'posts' | 'hashtags';

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [activeTab, setActiveTab] = useState<SearchTab>('all');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [results, setResults] = useState<{
        users: UserSummaryDto[];
        posts: PostSummaryDto[];
        hashtags: HashtagDto[];
    }>({
        users: [],
        posts: [],
        hashtags: []
    });

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
        const target = e.target as HTMLImageElement;
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F6BFF&color=fff&bold=true`;
    };

    const fetchResults = useCallback(async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const [usersRes, postsRes, hashtagsRes] = await Promise.all([
                userApi.searchUsers({ keyword: query, pageSize: 12 }),
                postApi.searchPosts({ keyword: query, pageSize: 10 }),
                hashtagApi.searchHashtags({ keyword: query, pageNumber: 1, pageSize: 20 })
            ]);

            setResults({
                users: usersRes.data?.items || [],
                posts: postsRes.data?.items || [],
                hashtags: hashtagsRes.data?.items || []
            });
        } catch (error) {
            console.error("Lỗi trang tìm kiếm:", error);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    useEffect(() => {
        let isMounted = true;
        const timerId = setTimeout(() => {
            if (isMounted) fetchResults();
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timerId);
        };
    }, [fetchResults]);

    const handlePostDeleted = (postId: string) => {
        setResults(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== postId)
        }));
    };

    const handlePostUpdated = (postId: string, newContent: string, newPrivacy: number) => {
        setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p => p.id === postId ? { ...p, content: newContent, privacy: newPrivacy } : p)
        }));
    };

    const hasAnyResults = results.users.length > 0 || results.posts.length > 0 || results.hashtags.length > 0;

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white pb-24 pt-28 animate-in fade-in duration-700 w-full overflow-x-hidden selection:bg-[#4F6BFF]/30 selection:text-[#4F6BFF]">

            {/* Hiệu ứng ánh sáng nền tinh tế */}
            <div className="fixed top-[-10%] right-[-10%] w-[800px] h-[600px] bg-[#4F6BFF]/5 blur-[160px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[500px] bg-[#FF1493]/5 blur-[140px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ================= HEADER ================= */}
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[#4F6BFF] text-xs font-bold uppercase tracking-[0.2em]">
                                <Sparkles size={14} />
                                <span>Intelligence Search</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                <span className="text-white/40 font-light mr-4">Kết quả cho</span>
                                <span className="text-white italic">"{query}"</span>
                            </h1>
                        </div>

                        {/* THANH TABS HIỆN ĐẠI (Segmented Control) */}
                        <div className="flex p-1 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
                            {(['all', 'users', 'posts', 'hashtags'] as const).map((tabId) => {
                                const labels: Record<SearchTab, string> = {
                                    all: 'Tất cả', users: 'Mọi người', posts: 'Bài viết', hashtags: 'Chủ đề'
                                };
                                const icons = {
                                    all: <LayoutGrid size={16} />,
                                    users: <Users size={16} />,
                                    posts: <FileText size={16} />,
                                    hashtags: <Hash size={16} />
                                };
                                const isActive = activeTab === tabId;
                                return (
                                    <button
                                        key={tabId}
                                        onClick={() => setActiveTab(tabId)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 min-w-max ${isActive
                                                ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {icons[tabId]}
                                        {labels[tabId]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </header>

                {/* ================= TRẠNG THÁI LOADING ================= */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 w-full animate-pulse">
                        <Loader2 className="w-12 h-12 animate-spin text-[#4F6BFF] mb-6 stroke-[1.5]" />
                        <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-xs">Đang truy xuất dữ liệu...</p>
                    </div>
                ) : !hasAnyResults ? (
                    /* ================= TRẠNG THÁI TRỐNG ================= */
                    <div className="flex flex-col items-center justify-center py-40 bg-white/[0.01] border border-white/5 rounded-[40px] w-full text-center px-4">
                        <div className="p-5 bg-white/5 rounded-full mb-6 ring-1 ring-white/10">
                            <AlertCircle size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Không tìm thấy kết quả</h3>
                        <p className="text-gray-500 max-w-sm text-sm leading-relaxed mx-auto">
                            Chúng tôi không tìm thấy thông tin khớp với <span className="text-white">"{query}"</span>. Hãy thử kiểm tra lại chính tả hoặc sử dụng từ khóa khác.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-20">

                        {/* ================= NGƯỜI DÙNG ================= */}
                        {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4 mb-8 px-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-3">
                                        <Users size={16} className="text-[#4F6BFF]" /> Mọi người
                                    </h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                                    {results.users.map((user) => (
                                        <Link
                                            key={user.id}
                                            to={`/profile/${user.userName}`}
                                            className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 flex items-center gap-4 shadow-sm"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={user.avatarUrl || '/default-avatar.png'}
                                                    className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-[#4F6BFF] transition-all duration-300 shadow-lg"
                                                    alt={user.fullName}
                                                    onError={(e) => handleImageError(e, user.fullName)}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-bold text-sm group-hover:text-[#4F6BFF] transition-colors truncate">{user.fullName}</h4>
                                                <p className="text-gray-500 text-xs mt-0.5 truncate">@{user.userName}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ================= CHỦ ĐỀ (HASHTAGS) ================= */}
                        {(activeTab === 'all' || activeTab === 'hashtags') && results.hashtags.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center gap-4 mb-8 px-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-3">
                                        <Hash size={16} className="text-[#FF1493]" /> Chủ đề
                                    </h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="flex flex-wrap gap-3 w-full px-2">
                                    {results.hashtags.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            to={`/hashtag/${tag.name}`}
                                            className="px-5 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-sm font-bold text-gray-400 hover:bg-[#FF1493]/10 hover:text-[#FF1493] hover:border-[#FF1493]/20 transition-all flex items-center gap-2"
                                        >
                                            <span className="text-[#FF1493]/50">#</span>
                                            {tag.name}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ================= BÀI VIẾT ================= */}
                        {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                            <section className="w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <div className="flex items-center gap-4 mb-10 px-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-3">
                                        <FileText size={16} className="text-[#00FF9F]" /> Luồng bài viết
                                    </h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>

                                <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
                                    {results.posts.map((post) => (
                                        <div key={post.id} className="w-full transition-transform hover:scale-[1.01] duration-500">
                                            <PostCard
                                                post={post}
                                                onPostDeleted={handlePostDeleted}
                                                onPostUpdated={handlePostUpdated}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Hiệu ứng tia sáng tìm kiếm phía trên cùng */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-[#4F6BFF]/20 to-transparent pointer-events-none" />
        </div>
    );
};

export default SearchPage;