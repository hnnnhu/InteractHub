// src/components/hashtag/TrendingHashtags.tsx

import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { hashtagApi, type TrendingHashtagDto } from '../../api/hashtagApi';
import HashtagLink from './HashtagLink';

interface TrendingHashtagsProps {
    limit?: number;
    className?: string;
}

const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({ limit = 5, className = '' }) => {
    const [trending, setTrending] = useState<TrendingHashtagDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchTrending = async () => {
            try {
                setLoading(true);
                const res = await hashtagApi.getTrendingHashtags(limit);
                if (isMounted && res.isSuccess) setTrending(res.data);
            } catch {
                if (isMounted) setError('Không thể tải danh sách thịnh hành.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTrending();
        return () => { isMounted = false; };
    }, [limit]);

    if (error) return null;

    return (
        <div className={`bg-[#0D0C13]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-xl ${className}`}>
            {/* Header Box */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4F6BFF]/10 rounded-xl flex items-center justify-center border border-[#4F6BFF]/20 shadow-[0_0_10px_rgba(79,107,255,0.1)]">
                    <TrendingUp className="w-5 h-5 text-[#4F6BFF]" />
                </div>
                <h3 className="font-bold text-white text-[19px] tracking-tight">Xu hướng cho bạn</h3>
            </div>

            <div className="flex flex-col">
                {loading ? (
                    // Skeleton Loading xịn xò
                    <div className="flex flex-col gap-4 mt-2">
                        {Array.from({ length: limit }).map((_, idx) => (
                            <div key={idx} className="animate-pulse flex flex-col gap-2.5">
                                <div className="h-3 bg-white/5 rounded w-1/3"></div>
                                <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                <div className="h-3 bg-white/5 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : trending.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center mt-2 py-6 bg-white/5 rounded-xl border border-white/5">
                        Chưa có dữ liệu xu hướng
                    </p>
                ) : (
                    // Nâng cấp: Hiệu ứng hover cho từng khối item
                    trending.map((tag) => (
                        <div key={tag.name} className="flex justify-between items-start group -mx-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="flex flex-col w-full">
                                {/* Hàng 1: Rank & Change Percent */}
                                <div className="text-[11px] text-gray-500 mb-1.5 flex items-center justify-between w-full">
                                    <span className="font-medium tracking-wider uppercase">#{tag.rank} Thịnh hành</span>
                                    {tag.changePercent === 100 ? (
                                        <span className="text-[#FFB800] flex items-center font-bold bg-[#FFB800]/10 px-1.5 py-0.5 rounded border border-[#FFB800]/20">
                                            <Sparkles className="w-2.5 h-2.5 mr-1" /> MỚI
                                        </span>
                                    ) : (tag.changePercent ?? 0) > 0 ? (
                                        <span className="text-[#00FF9F] flex items-center font-medium bg-[#00FF9F]/10 px-1.5 py-0.5 rounded border border-[#00FF9F]/20">
                                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> {tag.changePercent}%
                                        </span>
                                    ) : (tag.changePercent ?? 0) < 0 ? (
                                        <span className="text-[#FF1493] flex items-center font-medium bg-[#FF1493]/10 px-1.5 py-0.5 rounded border border-[#FF1493]/20">
                                            <ArrowDownRight className="w-3 h-3 mr-0.5" /> {Math.abs(tag.changePercent!)}%
                                        </span>
                                    ) : null}
                                </div>

                                {/* Hàng 2: Tên Hashtag */}
                                <HashtagLink
                                    name={tag.name}
                                    className="text-[16px] font-extrabold text-white group-hover:text-[#4F6BFF] no-underline transition-colors"
                                />

                                {/* Hàng 3: Usage Count */}
                                <span className="text-xs font-medium text-gray-500 mt-1.5">
                                    {formatCount(tag.usageCount)} bài viết
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TrendingHashtags;