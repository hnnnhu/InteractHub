// src/hooks/useGlobalSearch.ts

import { useState, useEffect, useCallback } from 'react';
import { postApi, type PostSummaryDto } from '../api/postApi';
import { userApi } from '../api/userApi';
import { hashtagApi, type HashtagDto } from '../api/hashtagApi';
import type { UserSummaryDto } from '../types/user';

interface GlobalSearchResults {
    posts: PostSummaryDto[];
    users: UserSummaryDto[];
    hashtags: HashtagDto[];
}

export default function useGlobalSearch(delay: number = 500) {
    const [keyword, setKeyword] = useState<string>('');
    const [results, setResults] = useState<GlobalSearchResults>({
        posts: [],
        users: [],
        hashtags: []
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Hàm thực hiện tìm kiếm tổng hợp từ 3 nguồn API
     */
    const performSearch = useCallback(async (searchKeyword: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Sử dụng allSettled để đảm bảo 1 API lỗi không làm hỏng cả quá trình
            const [postsRes, usersRes, hashtagsRes] = await Promise.allSettled([
                postApi.searchPosts({ keyword: searchKeyword, pageSize: 5 }),
                userApi.searchUsers({ keyword: searchKeyword, pageSize: 5 }),
                hashtagApi.searchHashtags({ keyword: searchKeyword, pageSize: 8 })
            ]);

            const newResults: GlobalSearchResults = {
                posts: [],
                users: [],
                hashtags: []
            };

            if (postsRes.status === 'fulfilled' && postsRes.value.isSuccess) {
                newResults.posts = postsRes.value.data?.items || [];
            }

            if (usersRes.status === 'fulfilled' && usersRes.value.isSuccess) {
                newResults.users = usersRes.value.data?.items || [];
            }

            if (hashtagsRes.status === 'fulfilled' && hashtagsRes.value.isSuccess) {
                newResults.hashtags = hashtagsRes.value.data?.items || [];
            }

            setResults(newResults);
        } catch (err: unknown) {
            console.error("Global Search Error:", err);
            setError("Đã xảy ra lỗi trong quá trình tìm kiếm.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * FIX: Đưa logic kiểm tra từ khóa vào trong setTimeout 
     * để tránh lỗi "setState synchronously within an effect"
     */
    useEffect(() => {
        let isMounted = true;

        const timer = setTimeout(() => {
            if (!isMounted) return;

            if (!keyword.trim()) {
                // Xử lý việc xóa kết quả một cách bất đồng bộ qua timer
                setResults({ posts: [], users: [], hashtags: [] });
                setIsLoading(false);
                setError(null);
                return;
            }

            performSearch(keyword);
        }, delay);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [keyword, delay, performSearch]);

    /**
     * Hàm xóa nhanh từ khóa và kết quả
     */
    const clearSearch = useCallback(() => {
        setKeyword('');
        setResults({ posts: [], users: [], hashtags: [] });
        setIsLoading(false);
        setError(null);
    }, []);

    return {
        keyword,
        setKeyword,
        results,
        isLoading,
        error,
        clearSearch,
        refresh: () => performSearch(keyword)
    };
}