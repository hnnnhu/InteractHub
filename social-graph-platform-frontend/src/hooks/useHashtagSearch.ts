// src/hooks/useHashtagSearch.ts

import { useState, useEffect, useCallback } from 'react';
import { hashtagApi, type HashtagDto } from '../api/hashtagApi';

interface UseHashtagSearchReturn {
    keyword: string;
    setKeyword: (val: string) => void;
    hashtags: HashtagDto[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
}

export const useHashtagSearch = (initialPageSize: number = 10): UseHashtagSearchReturn => {
    const [keyword, setKeyword] = useState<string>('');
    const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');

    const [hashtags, setHashtags] = useState<HashtagDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [pageNumber, setPageNumber] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    // Xử lý Debounce riêng biệt
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setPageNumber(1); // Reset page khi keyword thay đổi
        }, 300);

        return () => clearTimeout(timer);
    }, [keyword]);

    // Xử lý Fetch API bên TRONG Effect để tránh lỗi Cascading Renders
    useEffect(() => {
        let isMounted = true; // Biến cờ ngăn cập nhật state nếu component bị unmount

        const fetchHashtags = async () => {
            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                const cleanKeyword = debouncedKeyword.replace(/^#/, '');

                const response = await hashtagApi.searchHashtags({
                    keyword: cleanKeyword,
                    pageNumber: pageNumber,
                    pageSize: initialPageSize,
                    sortBy: 'UsageCount',
                    sortDescending: true
                });

                if (!isMounted) return;

                if (response.isSuccess && response.data) {
                    const newItems = response.data.items || [];

                    if (pageNumber > 1) {
                        setHashtags(prev => [...prev, ...newItems]);
                    } else {
                        setHashtags(newItems);
                    }

                    setHasMore(response.data.pageNumber < response.data.totalPages);
                } else {
                    setError(response.message || 'Lỗi khi tải danh sách hashtag');
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Lỗi kết nối đến máy chủ');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchHashtags();

        return () => {
            isMounted = false; // Dọn dẹp effect
        };
    }, [debouncedKeyword, pageNumber, initialPageSize]);

    // Các hàm tương tác với Component
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPageNumber(prev => prev + 1);
        }
    }, [loading, hasMore]);

    const refresh = useCallback(() => {
        setPageNumber(1);
    }, []);

    return {
        keyword,
        setKeyword,
        hashtags,
        loading,
        error,
        hasMore,
        loadMore,
        refresh
    };
};