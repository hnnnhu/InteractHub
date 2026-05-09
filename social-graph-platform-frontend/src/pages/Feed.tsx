// src/pages/Feed.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, Compass } from 'lucide-react';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import postApi from '../api/postApi';
import type { PostSummaryDto } from '../api/postApi';
import { StoryTray } from '../components/story/StoryTray';
import { StoryViewer } from '../components/story/StoryViewer';
import { CreateStoryForm } from '../components/story/CreateStoryForm';
import { useStoryFeed } from '../hooks/story/useStoryFeed';
import { useStoryViewer } from '../hooks/story/useStoryViewer';
import { useMyStories } from '../hooks/story/useMyStories';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import type { ActiveStoryDto } from '../types/story';

// Helper giống trong storyApi để resolve avatar URL
const resolveAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Feed: React.FC = () => {
    const { user } = useAuth();
    // Lấy ID từ userId – AuthResponse luôn có userId
    const currentUserId = user?.userId || '';

    const [posts, setPosts] = useState<PostSummaryDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const { feed } = useStoryFeed();
    const { myStories } = useMyStories();
    // useStoryViewer không cần currentUserId nữa
    const viewer = useStoryViewer({ feed });
    const [isCreatingStory, setIsCreatingStory] = useState(false);

    // Xây dựng ActiveStoryDto cho chính mình (nếu có story) với avatar đã resolve
    const myStoryUser: ActiveStoryDto | null = useMemo(() => {
        if (!myStories || myStories.stories.length === 0 || !user) return null;
        return {
            userId: user.userId, // user.userId luôn có giá trị
            userName: user.userName,
            fullName: user.fullName ?? '',
            avatarUrl: resolveAvatarUrl(user.avatarUrl),
            stories: myStories.stories,
            storyCount: myStories.stories.length,
            unviewedCount: myStories.unviewedCount,
            isAllViewed: myStories.isAllViewed,
            latestStoryCreatedAt: myStories.latestStoryCreatedAt,
        };
    }, [myStories, user]);

    // ─── FETCH INITIAL ────────────────────────────────
    useEffect(() => {
        let ignore = false;
        const fetchInitialFeed = async () => {
            try {
                const response = await postApi.getNewsFeed(1, 20);
                if (!ignore && response.isSuccess && response.data) {
                    setPosts(response.data.items);
                    setHasMore(response.data.hasNextPage);
                    setPage(1);
                }
            } catch (error) {
                console.error('Lỗi khi tải bảng tin:', error);
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };
        fetchInitialFeed();
        return () => { ignore = true; };
    }, []);

    // ─── LOAD MORE ────────────────────────────────────
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;
        try {
            const response = await postApi.getNewsFeed(nextPage, 20);
            if (response.isSuccess && response.data) {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPosts = response.data!.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPosts];
                });
                setHasMore(response.data.hasNextPage);
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Lỗi khi tải thêm:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, page]);

    // ─── INFINITE SCROLL ──────────────────────────────
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 300
            ) {
                if (hasMore && !isLoadingMore) handleLoadMore();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleLoadMore, hasMore, isLoadingMore]);

    // ─── HANDLERS ─────────────────────────────────────
    const handlePostCreated = (newPost: PostSummaryDto) =>
        setPosts(prev => [newPost, ...prev]);

    const handlePostUpdated = (postId: string, newContent: string, newPrivacy: number) =>
        setPosts(prev =>
            prev.map(post =>
                post.id === postId ? { ...post, content: newContent, privacy: newPrivacy } : post
            )
        );

    const handlePostDeleted = (postId: string) =>
        setPosts(prev => prev.filter(post => post.id !== postId));

    const handleStoryView = (user: ActiveStoryDto) => {
        if (user.userId === currentUserId) {
            viewer.openUser(user);
        } else {
            const idx = feed.findIndex(u => u.userId === user.userId);
            if (idx >= 0) viewer.open(idx);
        }
    };

    const handleOpenCreateStory = () => setIsCreatingStory(true);
    const handleCloseCreateStory = () => setIsCreatingStory(false);

    // ─── RENDER ───────────────────────────────────────
    return (
        <div className="relative w-full max-w-2xl mx-auto pt-20 pb-24 space-y-8 animate-in fade-in duration-500">
            {/* 📸 STORY TRAY */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-1"
            >
                <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-3xl p-1 shadow-xl">
                    <StoryTray
                        onView={handleStoryView}
                        onCreateStoryClick={handleOpenCreateStory}
                        myStoryUser={myStoryUser}
                    />
                </div>
            </motion.div>

            {/* 👁️ STORY VIEWER */}
            {viewer.visible && viewer.currentUser && (
                <StoryViewer
                    currentUser={viewer.currentUser}
                    currentStoryIndex={viewer.currentStoryIndex}
                    currentStory={viewer.currentStory}
                    currentUserId={currentUserId}
                    onNext={viewer.nextStory}
                    onPrev={viewer.prevStory}
                    onClose={viewer.close}
                />
            )}

            {/* ✍️ TẠO BÀI VIẾT */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="px-1"
            >
                <CreatePost onPostCreated={handlePostCreated} />
            </motion.div>

            {/* 📰 DANH SÁCH BÀI VIẾT */}
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-[#8E8E93]"
                    >
                        <Loader2 className="w-10 h-10 animate-spin text-[#FF1493] mb-4" />
                        <p className="font-medium animate-pulse">Đang kết nối không gian...</p>
                    </motion.div>
                ) : posts.length > 0 ? (
                    <div style={{ display: 'contents' }}>
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="px-1"
                            >
                                <PostCard
                                    post={post}
                                    onPostUpdated={handlePostUpdated}
                                    onPostDeleted={handlePostDeleted}
                                />
                                {index < posts.length - 1 && (
                                    <hr className="border-white/[0.07] mt-6" />
                                )}
                            </motion.div>
                        ))}
                        {isLoadingMore && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-[#4F6BFF]" />
                            </div>
                        )}
                        {!hasMore && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center py-10 text-[#8E8E93]"
                            >
                                <div className="w-12 h-12 bg-white/[0.07] rounded-full flex items-center justify-center mb-3">
                                    <Clock className="w-6 h-6 text-[#8E8E93]" />
                                </div>
                                <p className="text-sm font-medium">Bạn đã xem hết nội dung mới</p>
                                <p className="text-xs mt-1 opacity-70">Hãy quay lại sau để cập nhật thêm</p>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-1"
                    >
                        <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-[2rem] p-12 text-center shadow-xl">
                            <div className="w-24 h-24 bg-gradient-to-br from-[#252529] to-[#2E2E33] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.07] shadow-inner">
                                <Compass className="w-12 h-12 text-[#8E8E93]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Bảng tin trống trải</h3>
                            <p className="text-[#EBEBF5] opacity-85 text-[15px] max-w-sm mx-auto leading-relaxed">
                                Chưa có bài viết nào trên mạng lưới của bạn. Hãy là người đầu tiên chia sẻ suy nghĩ nhé!
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🎯 PORTAL: Tạo story mới */}
            {isCreatingStory &&
                createPortal(
                    <CreateStoryForm onClose={handleCloseCreateStory} />,
                    document.body
                )}
        </div>
    );
};

export default Feed;