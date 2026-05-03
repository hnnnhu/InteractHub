// src/components/feed/PostDetailModal.tsx
import React, { useEffect, useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Loader2,
    MessageCircle,
    Share2,
    Bookmark,
    Globe,
    Users,
    Lock,
    AlertTriangle,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import postApi, { type PostResponseDto, PrivacyLevel } from '../../api/postApi';
import savedPostApi from '../../api/savedPostApi';
import CommentSection from '../CommentSection/CommentSection';
import HashtagLink from '../hashtag/HashtagLink';
import MediaCarousel from './MediaCarousel';
import useReactionSummary from '../../hooks/useReactionSummary';
import ReactionButton from '../reaction/ReactionButton';
import ReactionCount from '../reaction/ReactionCount';
import ReactionUsersModal from '../reaction/ReactionUsersModal';
import type { ReactionCountDto } from '../../types/reaction';

// ──────────────────────────────────────────────
// Bảng màu đồng bộ (CSS variable không dùng được với Tailwind inline)
// Primary   : #4F6BFF (xanh tím) – nút chính, active, hashtag, carousel dot
// Secondary : #FF1493 (hồng)   – viền avatar, reaction khi active, icon nút đóng
// Success   : #00FF9F (xanh lá) – privacy CloseFriends, share
// Warning   : #FFB800 (vàng)    – bookmark active, privacy Private
// Background: #0D0C13 / #12101A / #1A1825
// ──────────────────────────────────────────────

interface PostDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ isOpen, onClose, postId }) => {
    const [post, setPost] = useState<PostResponseDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { summary, setSummary } = useReactionSummary(postId);
    const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // ── Fetch bài viết ──────────────────────────
    useEffect(() => {
        if (!isOpen || !postId) return;

        const resetTimer = setTimeout(() => {
            setPost(null);
            setError(null);
            setIsSaved(false);
            setLoading(true);
        }, 0);

        let isMounted = true;
        const fetchPostDetail = async () => {
            try {
                const res = await postApi.getPostById(postId);
                if (isMounted && res.isSuccess && res.data) {
                    setPost(res.data);
                    setIsSaved(res.data.isSavedByCurrentUser);
                } else {
                    if (isMounted) setError(res.message || 'Không tìm thấy bài viết');
                }
            } catch (err: unknown) {
                if (isMounted) {
                    let msg = 'Lỗi kết nối khi tải bài viết';
                    if (isAxiosError(err) && err.response?.data?.message) msg = err.response.data.message;
                    else if (err instanceof Error) msg = err.message;
                    setError(msg);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPostDetail();

        document.body.style.overflow = 'hidden';
        return () => {
            clearTimeout(resetTimer);
            isMounted = false;
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, postId]);

    // ── Phím ESC ───────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // ── Helpers ────────────────────────────────
    const formatLocalTime = (utcDate?: string) => {
        if (!utcDate) return '';
        const safeUtc = (!utcDate.endsWith('Z') && !utcDate.match(/[+-]\d{2}:?\d{2}$/)) ? `${utcDate}Z` : utcDate;
        return new Date(safeUtc).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleToggleSave = async () => {
        if (!post) return;
        const previous = isSaved;
        setIsSaved(!isSaved);
        try {
            if (isSaved) await savedPostApi.unsavePost(post.id);
            else await savedPostApi.savePost({ postId: post.id, collectionName: 'Mặc định' });
        } catch {
            setIsSaved(previous);
        }
    };

    const handleReactionChange = (newSummary?: ReactionCountDto) => {
        setSummary(newSummary ?? null);
    };

    if (!isOpen) return null;

    // ── Modal content ──────────────────────────
    const modalContent = (
        <Fragment>
            {/* Overlay + container chính */}
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-6 lg:p-10 bg-[#050505]/90 backdrop-blur-xl animate-in fade-in"
                onClick={onClose}
            >
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-6 md:right-8 p-2.5 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white hover:scale-110 transition-all z-[10001] border border-white/10"
                >
                    <X size={24} />
                </button>

                {/* Hộp thoại chính */}
                <div
                    className="bg-[#0D0C13] border border-white/[0.08] rounded-none md:rounded-[2.5rem] w-full max-w-[1280px] h-full md:h-[90vh] lg:h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── LOADING STATE ── */}
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D0C13] to-[#1A1825]">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-[#4F6BFF]/20 animate-ping" />
                                <Loader2 className="relative w-14 h-14 animate-spin text-[#4F6BFF]" />
                            </div>
                            <p className="text-gray-300 font-bold text-lg animate-pulse">Đang tải bài viết…</p>
                        </div>
                    ) : error || !post ? (
                        /* ── ERROR STATE ── */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D0C13] to-[#1A1825] p-8 text-center">
                            <div className="w-28 h-28 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-6 rotate-12">
                                <AlertTriangle size={48} className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] -rotate-12" />
                            </div>
                            <h2 className="text-white font-extrabold text-2xl mb-3">Không thể tải bài viết</h2>
                            <p className="text-gray-400 max-w-md mb-8">{error || 'Bài viết không tồn tại hoặc đã bị xóa.'}</p>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    setError(null);
                                }}
                                className="px-6 py-3 bg-[#4F6BFF] hover:bg-[#3f5ae0] text-white rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#4F6BFF]/20 active:scale-95"
                            >
                                <Loader2 size={18} className="animate-spin hidden" />
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        /* ── MAIN CONTENT ── */
                        <>
                            {/* CỘT TRÁI – Media Carousel */}
                            {post.mediaItems && post.mediaItems.length > 0 && (
                                <div className="w-full md:w-[55%] lg:w-[60%] bg-[#050505] h-[40vh] sm:h-[45vh] md:h-full border-b md:border-b-0 md:border-r border-white/[0.08] flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />
                                    <MediaCarousel mediaItems={post.mediaItems} />
                                </div>
                            )}

                            {/* CỘT PHẢI – Thông tin & Bình luận */}
                            <div
                                className={`w-full h-full flex flex-col bg-gradient-to-b from-[#12101A] via-[#0F0E15] to-[#0D0C13] relative ${post.mediaItems?.length ? 'md:w-[45%] lg:w-[40%]' : 'md:w-full max-w-4xl mx-auto'
                                    }`}
                            >
                                {/* ── HEADER ── */}
                                <div className="flex items-center justify-between p-5 lg:px-6 lg:py-5 border-b border-white/[0.08] bg-[#12101A]/80 backdrop-blur-2xl z-20 shrink-0">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full border-2 border-[#FF1493]/30 p-[2px] shrink-0 bg-[#1A1825] shadow-[0_0_15px_rgba(255,20,147,0.15)]">
                                            {post.avatarUrl ? (
                                                <img
                                                    src={post.avatarUrl}
                                                    alt={post.fullName}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#FF1493] font-bold text-lg rounded-full bg-[#1A1825]">
                                                    {post.fullName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-white text-[16px] leading-tight hover:text-[#FF1493] transition-colors cursor-pointer">
                                                {post.fullName}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400 mt-0.5">
                                                <span>{formatLocalTime(post.createdAt)}</span>
                                                <span className="text-gray-600">•</span>
                                                {post.privacy === PrivacyLevel.Public && (
                                                    <span title="Công khai"><Globe size={13} className="opacity-70" /></span>
                                                )}
                                                {(post.privacy === PrivacyLevel.FriendsOnly ||
                                                    post.privacy === PrivacyLevel.CloseFriends) && (
                                                        <span title="Bạn bè">
                                                            <Users size={13} className={`${post.privacy === PrivacyLevel.CloseFriends ? 'text-[#00FF9F]' : 'text-gray-400'} opacity-80`} />
                                                        </span>
                                                    )}
                                                {post.privacy === PrivacyLevel.Private && (
                                                    <span title="Chỉ mình tôi"><Lock size={13} className="text-[#FFB800] opacity-80" /></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── BODY ── */}
                                <div className="flex-1 overflow-y-auto p-5 lg:p-6 scroll-smooth custom-scrollbar">
                                    {post.content && (
                                        <div className="text-gray-200 text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap mb-5 break-words font-medium">
                                            {post.content}
                                        </div>
                                    )}

                                    {post.hashtags && post.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-2.5 mb-4">
                                            {post.hashtags.map((tag, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 px-3 py-1.5 rounded-xl transition-all hover:bg-[#4F6BFF]/20 hover:scale-105 shadow-sm cursor-pointer"
                                                >
                                                    <HashtagLink
                                                        name={tag}
                                                        className="text-[13.5px] font-bold text-[#4F6BFF] hover:text-white no-underline"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-6" />

                                    <CommentSection postId={post.id} initialCommentCount={post.commentCount} />
                                </div>

                                {/* ── STATS ROW ── */}
                                {((summary?.totalReactions ?? 0) > 0 || post.commentCount > 0) && (
                                    <div className="px-5 lg:px-6 py-2 border-t border-white/[0.05] flex items-center justify-between bg-[#12101A]/95 backdrop-blur-2xl z-20">
                                        <div className="flex items-center">
                                            {summary && summary.totalReactions > 0 && (
                                                <ReactionCount summary={summary} onClick={() => setIsReactionModalOpen(true)} />
                                            )}
                                        </div>
                                        <div className="text-[13px] text-gray-400 font-medium">
                                            {post.commentCount > 0 && (
                                                <span className="hover:text-gray-300 cursor-pointer transition-colors">
                                                    {post.commentCount} bình luận
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── FOOTER ACTIONS ── */}
                                <div className="border-t border-white/[0.08] bg-[#12101A]/95 backdrop-blur-2xl shrink-0 z-20">
                                    <div className="p-4 lg:px-6 lg:py-4 flex items-center justify-between text-gray-400">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            {/* Reaction Button */}
                                            <ReactionButton
                                                postId={post.id}
                                                currentUserReaction={summary?.currentUserReaction}
                                                onReactionChange={handleReactionChange}
                                            />

                                            {/* Comment Button */}
                                            <button className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all group hover:text-[#4F6BFF] hover:bg-white/5">
                                                <MessageCircle size={24} className="transition-transform duration-300 group-hover:scale-110" />
                                                <span className="font-bold text-[15px] hidden sm:block">Bình luận</span>
                                            </button>

                                            {/* Share Button */}
                                            <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl transition-all group hover:text-[#00FF9F] hover:bg-white/5">
                                                <Share2 size={24} className="transition-transform duration-300 group-hover:scale-110" />
                                                <span className="font-bold text-[15px]">Chia sẻ</span>
                                            </button>
                                        </div>

                                        {/* Bookmark Button */}
                                        <button
                                            onClick={handleToggleSave}
                                            className={`p-2.5 rounded-xl transition-all group ${isSaved
                                                    ? 'text-[#FFB800] bg-[#FFB800]/10 shadow-[0_0_10px_rgba(255,184,0,0.2)]'
                                                    : 'hover:text-[#FFB800] hover:bg-white/5'
                                                }`}
                                            title={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                                        >
                                            <Bookmark
                                                size={24}
                                                className={`transition-all duration-300 ${isSaved
                                                        ? 'fill-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.6)]'
                                                        : 'group-hover:scale-110'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Reaction Users List (Modal con) ── */}
            <ReactionUsersModal
                isOpen={isReactionModalOpen}
                onClose={() => setIsReactionModalOpen(false)}
                postId={postId}
            />
        </Fragment>
    );

    return createPortal(modalContent, document.body);
};

export default PostDetailModal;