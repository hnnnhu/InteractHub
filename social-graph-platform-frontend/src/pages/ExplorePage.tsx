// src/pages/ExplorePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Compass,
    Hash,
    TrendingUp,
    TrendingDown,
    Users,
    Sparkles,
    UserPlus,
    Loader2,
    ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PostCard from '../components/feed/PostCard';
import useFriendSuggestions from '../hooks/useFriendSuggestions';
import postApi from '../api/postApi';
import { hashtagApi } from '../api/hashtagApi';
import type { PostSummaryDto } from '../api/postApi';
import type { TrendingHashtagDto } from '../api/hashtagApi';
import axiosInstance from '../api/axiosInstance';

// ─── Helpers ────────────────────────────────────────────
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─── Subcomponent: Hashtag List Item ────────────────────
const HashtagListItem: React.FC<{ tag: TrendingHashtagDto }> = ({ tag }) => {
    const trend = (tag.changePercent ?? 0) >= 0 ? 'up' : 'down';
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-emerald-400' : 'text-rose-400';

    return (
        <Link
            to={`/hashtag/${tag.name}`}
            className="flex items-center justify-between px-3 py-3 -mx-3 rounded-xl hover:bg-[#252529] transition-colors group"
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-white group-hover:text-[#4F6BFF] transition-colors truncate">
                    #{tag.name}
                </span>
                <span className="text-xs text-[#8E8E93] flex-shrink-0">
                    {tag.usageCount.toLocaleString()} bài viết
                </span>
            </div>
            {tag.changePercent != null && (
                <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}
                >
                    <TrendIcon size={14} />
                    {tag.changePercent > 0 ? '+' : ''}
                    {tag.changePercent}%
                </span>
            )}
        </Link>
    );
};

// ─── Subcomponent: Trend Detail Item ────────────────────
const TrendDetailItem: React.FC<{
    name: string;
    usageCount: number;
    changePercent: number | null;
    trend: 'up' | 'down';
}> = ({ name, usageCount, changePercent, trend }) => {
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-emerald-400' : 'text-rose-400';
    const trendBg = trend === 'up' ? 'bg-emerald-500/10' : 'bg-rose-500/10';

    return (
        <div className="flex items-center justify-between p-4 bg-[#252529] border border-white/[0.07] rounded-xl">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">#{name}</span>
                    <TrendIcon size={16} className={trendColor} />
                </div>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                    {usageCount.toLocaleString()} bài viết
                </p>
                <svg
                    width="60"
                    height="12"
                    viewBox="0 0 100 12"
                    className="opacity-60 mt-1"
                >
                    <polyline
                        points={
                            trend === 'up'
                                ? '0,12 20,10 40,12 60,5 80,2 100,0'
                                : '0,0 20,5 40,3 60,10 80,15 100,12'
                        }
                        fill="none"
                        stroke={trend === 'up' ? '#4F6BFF' : '#FF1493'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {changePercent !== null && (
                <div
                    className={`ml-3 px-2.5 py-1 rounded-lg flex items-center gap-1 ${trendBg}`}
                >
                    <TrendIcon size={14} className={trendColor} />
                    <span className={`text-xs font-bold ${trendColor}`}>
                        {changePercent > 0 ? '+' : ''}
                        {changePercent}%
                    </span>
                </div>
            )}
        </div>
    );
};

// ─── Subcomponent: Suggested Friend Card (nhỏ gọn) ──────
const SuggestedFriendCard: React.FC<{
    suggestion: import('../types/friendship').FriendSuggestionDto;
    onAddSuccess: (userId: string) => void;
}> = ({ suggestion, onAddSuccess }) => {
    const [imgError, setImgError] = React.useState(false);
    const avatar = resolveUrl(suggestion.avatarUrl);
    const initials = (suggestion.fullName || 'U').charAt(0).toUpperCase();

    return (
        <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-2xl p-4 flex flex-col items-center gap-2 w-[160px] flex-shrink-0">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 p-[2px]">
                <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                    {avatar && !imgError ? (
                        <img
                            src={avatar}
                            alt={suggestion.fullName}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="text-white font-bold text-xl">{initials}</span>
                    )}
                </div>
            </div>
            {/* Tên & username */}
            <div className="text-center min-w-0 w-full">
                <p className="text-sm font-semibold text-white truncate">
                    {suggestion.fullName}
                </p>
                <p className="text-xs text-[#8E8E93] truncate">@{suggestion.userName}</p>
            </div>
            {/* Context: bạn chung hoặc lý do */}
            {suggestion.mutualFriendsCount > 0 ? (
                <p className="text-[11px] text-[#8E8E93] text-center">
                    {suggestion.mutualFriendsCount} bạn chung
                </p>
            ) : (
                <p className="text-[11px] text-[#8E8E93] text-center">
                    Gợi ý cho bạn
                </p>
            )}
            {/* CTA */}
            <button
                onClick={() => onAddSuccess(suggestion.userId)}
                className="w-full mt-auto py-2 text-xs font-semibold bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white rounded-xl hover:shadow-[0_0_15px_rgba(255,20,147,0.3)] transition-shadow"
            >
                <UserPlus size={14} className="inline mr-1" />
                Thêm bạn
            </button>
        </div>
    );
};

// ─── MAIN EXPLORE PAGE ─────────────────────────────────
const ExplorePage: React.FC = () => {
    const { suggestions, isLoading: loadingSuggestions } = useFriendSuggestions();

    const { data: postsData, isLoading: loadingPosts } = useQuery({
        queryKey: ['explore', 'recent-posts'],
        queryFn: async () => {
            const res = await postApi.getNewsFeed(1, 5);
            if (!res.isSuccess || !res.data)
                throw new Error(res.message || 'Không thể tải bài viết');
            return res.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });
    const posts: PostSummaryDto[] = postsData || [];

    const { data: trendingData, isLoading: loadingTrending } = useQuery({
        queryKey: ['explore', 'trending'],
        queryFn: async () => {
            const res = await hashtagApi.getTrendingHashtags(7);
            if (!res.isSuccess || !res.data)
                throw new Error(res.message || 'Không thể tải xu hướng');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
    const trendingHashtags: TrendingHashtagDto[] = trendingData || [];
    const topTwo = trendingHashtags.slice(0, 2);
    const topFive = trendingHashtags.slice(0, 5);

    return (
        <div className="pt-20 pb-10 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ─── Header ──────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-[#1C1C1E] border border-white/[0.07] rounded-xl">
                        <Compass size={24} className="text-[#FF1493]" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Khám phá
                        </h1>
                        <p className="text-[#8E8E93] text-sm mt-1 hidden sm:block">
                            Xu hướng, bài viết và những người bạn có thể biết
                        </p>
                    </div>
                </div>

                {/* ─── Row 1: Hashtag nổi bật + Xu hướng ───────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Hashtag nổi bật (trái) */}
                    <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-3xl p-5 h-fit flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Hash size={20} className="text-[#4F6BFF]" />
                            <h2 className="text-lg font-bold text-white">Hashtag nổi bật</h2>
                        </div>
                        {loadingTrending ? (
                            <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4F6BFF]" />
                            </div>
                        ) : topFive.length === 0 ? (
                            <p className="text-[#8E8E93] text-sm text-center py-4">
                                Chưa có hashtag nổi bật
                            </p>
                        ) : (
                            <div className="divide-y divide-white/[0.07] -my-1">
                                {topFive.map((tag) => (
                                    <HashtagListItem key={tag.name} tag={tag} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Xu hướng (phải) */}
                    <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-3xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-400" />
                                <h2 className="text-lg font-bold text-white">Xu hướng</h2>
                            </div>
                            {topTwo.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    <Sparkles size={12} /> MỚI
                                </span>
                            )}
                        </div>
                        {loadingTrending ? (
                            <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4F6BFF]" />
                            </div>
                        ) : topTwo.length > 0 ? (
                            <div className="space-y-3 flex-1">
                                {topTwo.map((tag) => {
                                    const trend: 'up' | 'down' =
                                        (tag.changePercent ?? 0) >= 0 ? 'up' : 'down';
                                    return (
                                        <TrendDetailItem
                                            key={tag.name}
                                            name={tag.name}
                                            usageCount={tag.usageCount}
                                            changePercent={tag.changePercent}
                                            trend={trend}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[#8E8E93] text-sm text-center py-4">
                                Chưa có xu hướng
                            </p>
                        )}
                    </div>
                </div>

                {/* ─── Row 2: Bài viết mới nhất (centered, max-width) ─── */}
                <section className="mb-12 max-w-[680px] mx-auto">
                    <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                        <Sparkles size={20} className="text-amber-400" />
                        Bài viết mới nhất
                    </h2>
                    {loadingPosts ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#4F6BFF]" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 bg-[#1C1C1E] border border-white/[0.07] rounded-3xl">
                            <p className="text-[#8E8E93]">Chưa có bài viết nào.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ─── Row 3: Gợi ý kết bạn (horizontal scroll) ─── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users size={20} className="text-emerald-400" />
                            Gợi ý kết bạn
                        </h2>
                        {suggestions.length > 4 && (
                            <Link
                                to="/friends"
                                className="text-sm font-medium text-[#4F6BFF] hover:text-[#7B5AFF] flex items-center gap-1 transition-colors"
                            >
                                Xem tất cả <ChevronRight size={16} />
                            </Link>
                        )}
                    </div>
                    {loadingSuggestions ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-[#4F6BFF]" size={24} />
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-8 bg-[#1C1C1E] border border-white/[0.07] rounded-3xl">
                            <p className="text-[#8E8E93]">Chưa có gợi ý nào.</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                            {suggestions.slice(0, 6).map((s) => (
                                <div key={s.userId} className="snap-start">
                                    <SuggestedFriendCard
                                        suggestion={s}
                                        onAddSuccess={() => { }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ExplorePage;