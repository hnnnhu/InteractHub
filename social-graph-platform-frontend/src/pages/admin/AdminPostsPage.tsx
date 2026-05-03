// src/pages/admin/AdminPostsPage.tsx
// Lấy dữ liệu like/comment thực tế qua commentApi + reactionApi

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { commentApi } from '../../api/commentApi';
import { reactionApi } from '../../api/reactionApi';
import type { AdminPost, PagedResult } from '../../types/admin';
import {
    Search, Trash2, Eye, Heart, MessageCircle, Share2,
    ChevronLeft, ChevronRight, AlertTriangle, X,
    Globe, Users, Lock, ImageIcon, Filter, RefreshCw,
    FileText, Clock, Shield,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

interface ExtendedAdminPost extends AdminPost {
    authorAvatarUrl?: string | null;
    firstMediaUrl?: string | null;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
}

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    postTitle?: string;
}

interface PostDetailModalProps {
    post: ExtendedAdminPost | null;
    onClose: () => void;
}

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    isVisible: boolean;
}

interface KpiCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
}

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────

const PRIVACY_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string; dot: string }> = {
    Public: {
        label: 'Công khai',
        icon: <Globe className="w-3 h-3" />,
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400'
    },
    FriendsOnly: {
        label: 'Bạn bè',
        icon: <Users className="w-3 h-3" />,
        className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        dot: 'bg-violet-400'
    },
    Private: {
        label: 'Riêng tư',
        icon: <Lock className="w-3 h-3" />,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400'
    },
    CloseFriends: {
        label: 'Bạn thân',
        icon: <Heart className="w-3 h-3" />,
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400'
    },
};

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = import.meta.env.VITE_API_URL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const truncateText = (text: string, maxLength: number = 120): string => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
};

// ──────────────────────────────────────────────────────────────
// ENRICH POSTS WITH STATS
// ──────────────────────────────────────────────────────────────

const enrichPostsWithStats = async (posts: AdminPost[]): Promise<ExtendedAdminPost[]> => {
    const enriched = await Promise.all(
        posts.map(async (post) => {
            let totalComments = 0;
            let totalLikes = 0;

            try {
                // Lấy tổng số bình luận từ API (chỉ cần totalCount)
                const commentRes = await commentApi.getCommentsByPost(post.id, 1, 1);
                if (commentRes.isSuccess && commentRes.data) {
                    totalComments = commentRes.data.totalCount;
                }

                // Lấy tóm tắt reactions và tính tổng like
                const reactionRes = await reactionApi.getReactionSummary(post.id);
                if (reactionRes.isSuccess && reactionRes.data?.reactions) {
                    totalLikes = reactionRes.data.reactions.reduce((sum, r) => sum + r.count, 0);
                }
            } catch (error) {
                console.error(`Không thể lấy stats cho bài viết ${post.id}`, error);
            }

            return {
                ...post,
                commentCount: totalComments,
                likeCount: totalLikes,
                shareCount: 0, // Backend hiện chưa cung cấp
            } as ExtendedAdminPost;
        })
    );
    return enriched;
};

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────────────────

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, colorClass, bgClass }) => (
    <div className={`${bgClass} rounded-2xl p-5 border border-white/[0.06] backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${colorClass} tabular-nums`}>{value.toLocaleString()}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-white/[0.05]`}>
                {icon}
            </div>
        </div>
    </div>
);

const PrivacyBadge: React.FC<{ privacy: string }> = ({ privacy }) => {
    const config = PRIVACY_CONFIG[privacy] || PRIVACY_CONFIG.Public;
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium border ${config.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
};

const StatBadge: React.FC<{
    icon: React.ReactNode;
    value: number;
    label?: string;
    active?: boolean;
}> = ({ icon, value, label, active }) => (
    <div
        className={`flex items-center gap-1.5 text-xs transition-colors ${active ? 'text-gray-300' : 'text-gray-500'
            }`}
        title={label ? `${label}: ${value}` : `${value}`}
    >
        {icon}
        <span className="font-mono tabular-nums font-medium">{value.toLocaleString()}</span>
    </div>
);

const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible }) => {
    const bgClass = type === 'success'
        ? 'bg-emerald-600 border-emerald-400/20'
        : 'bg-red-600 border-red-400/20';

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] ${bgClass} border text-white px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-500 ease-out flex items-center gap-3 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}
            role="alert"
        >
            {type === 'success' ? (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="bg-[#1A1A1C] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-white/[0.06] rounded w-24" />
                <div className="h-2.5 bg-white/[0.06] rounded w-16" />
                <div className="h-2 bg-white/[0.06] rounded w-20" />
            </div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-2.5 bg-white/[0.06] rounded w-16" />
            <div className="h-3 bg-white/[0.06] rounded w-full" />
            <div className="h-3 bg-white/[0.06] rounded w-3/4" />
        </div>
        <div className="flex justify-between items-center">
            <div className="flex gap-3">
                <div className="h-3 bg-white/[0.06] rounded w-10" />
                <div className="h-3 bg-white/[0.06] rounded w-10" />
                <div className="h-3 bg-white/[0.06] rounded w-10" />
            </div>
            <div className="flex gap-2">
                <div className="h-8 w-8 bg-white/[0.06] rounded-lg" />
                <div className="h-8 w-8 bg-white/[0.06] rounded-lg" />
            </div>
        </div>
    </div>
);

const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
    <div className="text-center py-20 bg-[#1A1A1C] rounded-2xl border border-white/[0.06]">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/[0.03] flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Không tìm thấy bài viết</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Không có bài viết nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc làm mới trang.
        </p>
        <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
        >
            <RefreshCw className="w-4 h-4" />
            Làm mới
        </button>
    </div>
);

const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="bg-red-500/5 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{message}</p>
        </div>
        <button
            onClick={onRetry}
            className="shrink-0 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
        >
            Thử lại
        </button>
    </div>
);

// ──────────────────────────────────────────────────────────────
// MODALS
// ──────────────────────────────────────────────────────────────

const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen, onClose, onConfirm, isLoading, postTitle
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/15 rounded-xl shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Xác nhận xóa bài viết</h3>
                        <p className="text-sm text-gray-400">
                            Hành động này sẽ ẩn bài viết khỏi người dùng. Bạn có thể khôi phục sau nếu cần.
                        </p>
                        {postTitle && (
                            <p className="text-sm text-gray-500 mt-2 italic truncate max-w-[250px]">
                                "{truncateText(postTitle, 60)}"
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Xóa bài viết
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
    if (!post) return null;

    const avatarUrl = resolveUrl(post.authorAvatarUrl);
    const firstMediaUrl = resolveUrl(post.firstMediaUrl);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-xl p-5 border-b border-white/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FF1493]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#FF1493]" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Chi tiết bài viết</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={post.authorName}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10">
                                {post.authorName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-white">{post.authorName}</p>
                            <p className="text-sm text-gray-400">@{post.authorName?.toLowerCase().replace(/\s/g, '')}</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                            {post.content || <span className="text-gray-600 italic">Không có nội dung</span>}
                        </p>
                    </div>

                    {firstMediaUrl && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                                Ảnh đính kèm
                            </p>
                            <img
                                src={firstMediaUrl}
                                alt="media"
                                className="rounded-lg object-cover w-full max-h-80 bg-black/20 border border-white/5"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" />
                            <span className="font-mono">{post.likeCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-mono">{post.commentCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Share2 className="w-4 h-4" />
                            <span className="font-mono">{post.shareCount ?? 0}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(post.createdAt)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

const AdminPostsPage: React.FC = () => {
    const [posts, setPosts] = useState<PagedResult<AdminPost> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 12;

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const isMounted = useRef(true);

    const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [selectedPost, setSelectedPost] = useState<ExtendedAdminPost | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchPostsAsync = useCallback(
        (keyword: string, pageNum: number) =>
            adminApi.getPosts({ keyword, pageNumber: pageNum, pageSize }),
        [pageSize],
    );

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                const res = await fetchPostsAsync(searchTerm, page);
                if (cancelled || !isMounted.current) return;
                if (res.isSuccess && res.data) {
                    // Enrich dữ liệu với số liệu thực tế
                    const enrichedItems = await enrichPostsWithStats(res.data.items);
                    if (!cancelled && isMounted.current) {
                        setPosts({ ...res.data, items: enrichedItems });
                        setError(null);
                    }
                } else {
                    setError(res.message || 'Không thể tải danh sách bài viết.');
                }
            } catch (err: unknown) {
                if (cancelled || !isMounted.current) return;
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
            } finally {
                if (!cancelled && isMounted.current) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [fetchPostsAsync, searchTerm, page, refreshTrigger]);

    const kpi = useMemo(() => {
        if (!posts?.items) return { totalPosts: 0, totalLikes: 0, totalComments: 0, totalShares: 0 };
        let likes = 0, comments = 0, shares = 0;
        posts.items.forEach((post) => {
            const ep = post as ExtendedAdminPost;
            likes += ep.likeCount ?? 0;
            comments += ep.commentCount ?? 0;
            shares += ep.shareCount ?? 0;
        });
        return {
            totalPosts: posts.totalCount,
            totalLikes: likes,
            totalComments: comments,
            totalShares: shares,
        };
    }, [posts]);

    const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const term = inputValue.trim();
        setSearchTerm(term);
        setPage(1);
        setLoading(true);
        setError(null);
    }, [inputValue]);

    const handlePageChange = useCallback((newPage: number) => {
        if (posts && (newPage < 1 || newPage > posts.totalPages)) return;
        setPage(newPage);
        setLoading(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [posts]);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3500);
    }, []);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await adminApi.deletePost(deleteTarget.id);
            if (!res.isSuccess) throw new Error(res.message || 'Xóa thất bại');

            setRefreshTrigger(prev => prev + 1);
            showToast('Đã xóa bài viết thành công', 'success');
        } catch (err: unknown) {
            showToast(
                err instanceof Error ? err.message : 'Lỗi hệ thống',
                'error'
            );
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const totalPages = posts?.totalPages ?? 0;
    const currentPage = posts?.pageNumber ?? page;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                        Quản lý bài viết
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Giám sát và kiểm duyệt nội dung người dùng
                    </p>
                </div>
                {!loading && kpi.totalPosts > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/5">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium text-gray-300">{kpi.totalPosts.toLocaleString()}</span>
                        bài viết
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard
                    label="Tổng bài viết"
                    value={kpi.totalPosts}
                    icon={<FileText className="w-5 h-5" />}
                    colorClass="text-blue-400"
                    bgClass="bg-blue-500/5"
                />
                <KpiCard
                    label="Tổng lượt thích"
                    value={kpi.totalLikes}
                    icon={<Heart className="w-5 h-5" />}
                    colorClass="text-rose-400"
                    bgClass="bg-rose-500/5"
                />
                <KpiCard
                    label="Tổng bình luận"
                    value={kpi.totalComments}
                    icon={<MessageCircle className="w-5 h-5" />}
                    colorClass="text-amber-400"
                    bgClass="bg-amber-500/5"
                />
                <KpiCard
                    label="Tổng chia sẻ"
                    value={kpi.totalShares}
                    icon={<Share2 className="w-5 h-5" />}
                    colorClass="text-emerald-400"
                    bgClass="bg-emerald-500/5"
                />
            </div>

            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF1493] transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo nội dung, tác giả..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF1493]/30 focus:border-[#FF1493]/30 transition-all text-sm"
                        />
                        {inputValue && (
                            <button
                                type="button"
                                onClick={() => {
                                    setInputValue('');
                                    setSearchTerm('');
                                    setPage(1);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-[#FF1493] hover:bg-[#FF1493]/90 text-white px-5 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-lg shadow-[#FF1493]/20 hover:shadow-[#FF1493]/30 active:scale-[0.98]"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden sm:inline">Tìm kiếm</span>
                    </button>
                </div>
                {searchTerm && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                        <Filter className="w-4 h-4" />
                        <span>
                            Kết quả cho: <span className="text-white font-medium">"{searchTerm}"</span>
                        </span>
                        <button
                            onClick={() => {
                                setInputValue('');
                                setSearchTerm('');
                                setPage(1);
                            }}
                            className="text-[#FF1493] hover:underline ml-1"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </form>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {error && !loading && (
                <div className="mb-6">
                    <ErrorBanner message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />
                </div>
            )}

            {!loading && !error && posts && posts.items.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {posts.items.map((post) => {
                            const extendedPost = post as ExtendedAdminPost;
                            const hasMedia = !!extendedPost.firstMediaUrl;
                            const hasContent = !!post.content;
                            const avatarUrl = resolveUrl(extendedPost.authorAvatarUrl);

                            return (
                                <article
                                    key={post.id}
                                    className="group bg-[#1A1A1C] border border-white/[0.06] rounded-2xl p-5 flex flex-col hover:border-white/[0.12] transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={post.authorName}
                                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#FF1493]/30 transition-all"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-2 ring-white/10 group-hover:ring-[#FF1493]/30 transition-all">
                                                {post.authorName?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-100 truncate group-hover:text-white transition-colors">
                                                {post.authorName}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                @{post.authorName?.toLowerCase().replace(/\s/g, '')}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                <time dateTime={post.createdAt}>
                                                    {formatDate(post.createdAt)}
                                                </time>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-3">
                                        <PrivacyBadge privacy={post.privacy} />
                                        <div className="flex-1">
                                            {hasContent ? (
                                                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 break-words">
                                                    {post.content}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 italic">
                                                    Bài viết không có nội dung văn bản
                                                </p>
                                            )}
                                        </div>
                                        {hasMedia && (
                                            <button
                                                onClick={() => setSelectedPost(extendedPost)}
                                                className="w-full h-40 rounded-xl overflow-hidden border border-white/5 bg-black/40 relative group/media cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF1493]/50"
                                                aria-label="Xem chi tiết bài viết"
                                            >
                                                <img
                                                    src={resolveUrl(extendedPost.firstMediaUrl) ?? undefined}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover/media:bg-black/10 transition-colors" />
                                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm p-1.5 rounded-lg">
                                                    <ImageIcon className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                                        <div className="flex items-center gap-4">
                                            <StatBadge
                                                icon={<Heart className="w-3.5 h-3.5" />}
                                                value={extendedPost.likeCount ?? 0}
                                                label="Lượt thích"
                                                active={(extendedPost.likeCount ?? 0) > 0}
                                            />
                                            <StatBadge
                                                icon={<MessageCircle className="w-3.5 h-3.5" />}
                                                value={extendedPost.commentCount ?? 0}
                                                label="Bình luận"
                                                active={(extendedPost.commentCount ?? 0) > 0}
                                            />
                                            <StatBadge
                                                icon={<Share2 className="w-3.5 h-3.5" />}
                                                value={extendedPost.shareCount ?? 0}
                                                label="Chia sẻ"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setSelectedPost(extendedPost)}
                                                className="p-2 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-[#FF1493] rounded-lg transition-all"
                                                title="Xem chi tiết"
                                                aria-label="Xem chi tiết bài viết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(post)}
                                                className="p-2 bg-red-500/[0.04] hover:bg-red-500/[0.12] text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                                title="Xóa bài viết"
                                                aria-label="Xóa bài viết"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/[0.06] gap-4">
                        <div className="text-sm text-gray-400">
                            Hiển thị{' '}
                            <span className="text-gray-300 font-medium">
                                {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, posts.totalCount)}
                            </span>{' '}
                            trong tổng số{' '}
                            <span className="text-gray-300 font-medium">{posts.totalCount.toLocaleString()}</span>{' '}
                            bài viết
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage <= 1}
                                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hidden sm:block"
                                title="Trang đầu"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <ChevronLeft className="w-4 h-4 -ml-3" />
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="p-2.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Trang trước"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pageNum === currentPage
                                                    ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/20'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="p-2.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Trang sau"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hidden sm:block"
                                title="Trang cuối"
                            >
                                <ChevronRight className="w-4 h-4" />
                                <ChevronRight className="w-4 h-4 -ml-3" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {!loading && !error && posts && posts.items.length === 0 && (
                <EmptyState onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
            )}

            <DeleteModal
                isOpen={!!deleteTarget}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                isLoading={deleting}
                postTitle={deleteTarget?.content ?? undefined}
            />

            <PostDetailModal
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
            />

            <Toast message={toastMessage} type={toastType} isVisible={toastVisible} />
        </div>
    );
};

export default AdminPostsPage;