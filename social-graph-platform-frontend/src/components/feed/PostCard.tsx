// src/components/feed/PostCard.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { isAxiosError } from 'axios';
import {
    MessageCircle,
    Share2,
    MoreHorizontal,
    Globe,
    Users,
    Lock,
    Bookmark,
    Edit2,
    Trash2,
    Flag,
} from 'lucide-react';

import postApi, { PrivacyLevel, resolveMediaUrl } from '../../api/postApi';
import savedPostApi from '../../api/savedPostApi';
import type { PostSummaryDto } from '../../api/postApi';
import type { ReactionCountDto } from '../../types/reaction';

import { useAuth } from '../../context/AuthContext';
import CommentSection from '../CommentSection/CommentSection';
import SaveToCollectionModal from './SaveToCollectionModal';
import HashtagLink from '../hashtag/HashtagLink';
import EditPostModal from './EditPostModal';
import PostDetailModal from './PostDetailModal';

// --- REACTION COMPONENTS ---
import useReactionSummary from '../../hooks/useReactionSummary';
import ReactionButton from '../reaction/ReactionButton';
import ReactionCount from '../reaction/ReactionCount';
import ReactionUsersModal from '../reaction/ReactionUsersModal';

// --- REPORT ---
import ReportModal from '../report/ReportModal';

// ✅ Sử dụng renderContentWithHighlights thay thế cho renderContentWithHashtags
import { renderContentWithHighlights } from '../../utils/renderContentWithHighlights';

interface PostCardProps {
    post: PostSummaryDto;
    onLikeChange?: () => void;
    onPostUpdated?: (postId: string, newContent: string, newPrivacy: number) => void;
    onPostDeleted?: (postId: string) => void;
}

interface AuthUserPayload {
    id?: string;
    userId?: string;
    [key: string]: unknown;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLikeChange, onPostUpdated, onPostDeleted }) => {
    const { user } = useAuth();

    const safeUser = user as unknown as AuthUserPayload | null;
    const currentUserId = safeUser?.userId || safeUser?.id;
    const isOwner = Boolean(currentUserId && currentUserId === post.userId);

    // --- REACTION SUMMARY ---
    const { summary, setSummary } = useReactionSummary(post.id);

    // --- POST DATA STATES ---
    const [localContent, setLocalContent] = useState(post.content || '');
    const [localPrivacy, setLocalPrivacy] = useState(post.privacy);
    const [isDeleted, setIsDeleted] = useState(false);

    // --- SAVE & COMMENT STATES ---
    const [isSaved, setIsSaved] = useState(post.isSavedByCurrentUser);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount);

    // --- MENU & MODALS ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // --- IMAGE ERROR STATES ---
    const [avatarError, setAvatarError] = useState(false);
    const [mediaError, setMediaError] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    // Resolve avatar URL một lần (đảm bảo tuyệt đối, không bị trùng lặp uploads/)
    const resolvedAvatarUrl = resolveMediaUrl(post.avatarUrl);
    const resolvedMediaUrl = resolveMediaUrl(post.firstMediaUrl);

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ================= HANDLERS =================

    const handleReactionChange = (newSummary?: ReactionCountDto) => {
        if (newSummary) setSummary(newSummary);
        if (onLikeChange) onLikeChange();
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaved) {
            handleUnsave();
        } else {
            setShowSaveModal(true);
        }
    };

    const handleUnsave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const originalSaved = isSaved;
        setIsSaved(false);

        try {
            const response = await savedPostApi.unsavePost(post.id);
            if (response && response.isSuccess === false) {
                throw new Error(response.message);
            }
        } catch (error: unknown) {
            console.error('Thao tác bỏ lưu bài viết thất bại:', error);
            setIsSaved(originalSaved);
            let errorMessage = 'Không thể bỏ lưu bài viết!';
            if (isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSuccess = (collectionName: string) => {
        setIsSaved(true);
        console.log(`✅ Bài viết đã được lưu vào danh mục: ${collectionName}`);
    };

    const handleCommentCountChange = useCallback((newCount: number) => {
        setCommentCount(newCount);
    }, []);

    const handleDeleteConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await postApi.deletePost(post.id);
            setIsDeleteModalOpen(false);
            setIsDeleted(true);
            if (onPostDeleted) onPostDeleted(post.id);
        } catch (error: unknown) {
            console.error('Lỗi khi xóa bài viết:', error);
            alert('Xóa bài viết thất bại!');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSuccess = (newContent: string, newPrivacy: number) => {
        setLocalContent(newContent);
        setLocalPrivacy(newPrivacy);
        if (onPostUpdated) onPostUpdated(post.id, newContent, newPrivacy);
    };

    const navigateToProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Điều hướng tới trang profile nếu cần
    };

    // ================= FORMAT DATA =================

    const formatLocalTime = (utcDateString?: string) => {
        if (!utcDateString) return '';
        const isMissingTimezone = !utcDateString.endsWith('Z') && !utcDateString.match(/[+-]\d{2}:?\d{2}$/);
        const safeUtcString = isMissingTimezone ? `${utcDateString}Z` : utcDateString;
        const date = new Date(safeUtcString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getPrivacyIcon = () => {
        switch (localPrivacy) {
            case PrivacyLevel.Public:
                return <Globe className="w-3.5 h-3.5" />;
            case PrivacyLevel.FriendsOnly:
                return <Users className="w-3.5 h-3.5" />;
            case PrivacyLevel.Private:
                return <Lock className="w-3.5 h-3.5" />;
            case PrivacyLevel.CloseFriends:
                return <Users className="w-3.5 h-3.5 text-[#00FF9F]" />;
            default:
                return <Globe className="w-3.5 h-3.5" />;
        }
    };

    if (isDeleted) return null;

    return (
        <>
            <div className="bg-[#0D0C13]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 sm:p-6 mb-6 shadow-xl hover:border-white/20 transition-all duration-300">
                {/* 1. HEADER */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Avatar */}
                        <div
                            className="w-12 h-12 rounded-full border-2 border-[#FF1493]/30 p-[2px] flex-shrink-0 cursor-pointer group z-10 relative"
                            onClick={navigateToProfile}
                        >
                            <div className="w-full h-full bg-[#1A1825] rounded-full overflow-hidden flex items-center justify-center">
                                {resolvedAvatarUrl && !avatarError ? (
                                    <img
                                        src={resolvedAvatarUrl}
                                        alt={post.fullName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <span className="text-[#FF1493] font-bold text-lg">
                                        {(post.fullName || 'U').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* User Info -> tap to open detail modal */}
                        <div
                            className="flex flex-col justify-center cursor-pointer group"
                            onClick={() => setIsDetailModalOpen(true)}
                        >
                            <div className="flex items-center gap-2 flex-wrap leading-tight">
                                <span className="font-bold text-white text-[15px] sm:text-[16px] group-hover:text-[#FF1493] transition-colors tracking-wide">
                                    {post.fullName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 text-[13px] mt-0.5 group-hover:text-gray-400 transition-colors">
                                <span>@{post.userName}</span>
                                <span>•</span>
                                <span>{formatLocalTime(post.createdAt)}</span>
                                <span>•</span>
                                <span title="Quyền riêng tư" className="text-gray-400">
                                    {getPrivacyIcon()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* THREE-DOT MENU (OWNER ONLY) */}
                    {isOwner && (
                        <div className="relative z-30" ref={menuRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1A1825]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditModalOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <Edit2 size={16} className="text-[#4F6BFF]" /> Chỉnh sửa
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDeleteModalOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors border-t border-white/5"
                                    >
                                        <Trash2 size={16} /> Xóa bài viết
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. TEXT CONTENT – ĐÃ THAY ĐỔI: sử dụng renderContentWithHighlights */}
                <div
                    onClick={() => setIsDetailModalOpen(true)}
                    className="mt-4 text-gray-200 text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap break-words cursor-pointer group font-medium"
                >
                    {renderContentWithHighlights(localContent)}
                </div>

                {/* HASHTAG CHIPS */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 relative z-10">
                        {post.hashtags.map((tag, index) => (
                            <div
                                key={index}
                                className="bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 px-3 py-1.5 rounded-lg transition-all hover:bg-[#4F6BFF]/20 hover:scale-105 shadow-sm"
                            >
                                <HashtagLink
                                    name={tag}
                                    className="text-[13.5px] font-bold text-[#4F6BFF] hover:text-white no-underline"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. MEDIA PREVIEW */}
                {resolvedMediaUrl && !mediaError && (
                    <div
                        onClick={() => setIsDetailModalOpen(true)}
                        className="mt-4 rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer"
                    >
                        <img
                            src={resolvedMediaUrl}
                            alt="Media bài viết"
                            className="w-full max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                            onError={() => setMediaError(true)}
                        />
                        {post.mediaCount > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
                                + {post.mediaCount - 1} ảnh
                            </div>
                        )}
                    </div>
                )}

                {/* 4. STATS ROW */}
                {((summary?.totalReactions ?? 0) > 0 || commentCount > 0) && (
                    <div className="flex items-center justify-between mt-5 mb-1 px-1">
                        <div className="flex items-center">
                            {summary && summary.totalReactions > 0 && (
                                <ReactionCount summary={summary} onClick={() => setIsReactionModalOpen(true)} />
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-[13.5px] text-gray-400 font-medium">
                            {commentCount > 0 && (
                                <span
                                    className="hover:text-gray-300 cursor-pointer transition-colors"
                                    onClick={() => setShowComments(!showComments)}
                                >
                                    {commentCount} bình luận
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. ACTION BUTTONS ROW */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-gray-400 select-none relative z-10 mt-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Reaction button */}
                        <ReactionButton
                            postId={post.id}
                            currentUserReaction={summary?.currentUserReaction}
                            onReactionChange={handleReactionChange}
                        />

                        {/* Comment button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowComments(!showComments);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${showComments
                                ? 'text-[#4F6BFF] bg-[#4F6BFF]/10'
                                : 'hover:text-[#4F6BFF] hover:bg-white/5'
                                }`}
                        >
                            <MessageCircle
                                size={24}
                                className={`transition-transform duration-300 ${showComments ? 'fill-[#4F6BFF]' : 'group-hover:scale-110'
                                    }`}
                            />
                            <span
                                className={`font-bold text-[15px] hidden sm:block ${showComments ? 'text-[#4F6BFF]' : ''
                                    }`}
                            >
                                Bình luận
                            </span>
                        </button>

                        {/* Share button */}
                        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:text-[#00FF9F] hover:bg-white/5 transition-all group hidden md:flex">
                            <Share2 size={24} className="group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-bold text-[15px]">Chia sẻ</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Bookmark button */}
                        <button
                            onClick={handleBookmarkClick}
                            disabled={isSaving}
                            className={`p-2.5 rounded-xl transition-all group ${isSaved
                                ? 'text-[#FFB800] bg-[#FFB800]/10'
                                : 'hover:text-white hover:bg-white/5'
                                }`}
                            title={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                        >
                            <Bookmark
                                size={24}
                                className={`transition-all duration-300 ${isSaved
                                    ? 'fill-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.6)]'
                                    : 'group-hover:scale-110'
                                    } ${isSaving ? 'opacity-50' : ''}`}
                            />
                        </button>

                        {/* 👇 REPORT BUTTON */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowReportModal(true);
                            }}
                            className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                            title="Báo cáo bài viết"
                        >
                            <Flag size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 6. COMMENTS SECTION */}
                {showComments && (
                    <div className="mt-3 relative z-20">
                        <CommentSection
                            postId={post.id}
                            initialCommentCount={post.commentCount}
                            onCommentCountChange={handleCommentCountChange}
                        />
                    </div>
                )}
            </div>

            {/* ================= MODALS ================= */}
            <PostDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                postId={post.id}
            />

            <ReactionUsersModal
                isOpen={isReactionModalOpen}
                onClose={() => setIsReactionModalOpen(false)}
                postId={post.id}
            />

            <SaveToCollectionModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                postId={post.id}
                onSaveSuccess={handleSaveSuccess}
            />

            <EditPostModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                postId={post.id}
                initialContent={localContent}
                initialPrivacy={localPrivacy}
                onSuccess={handleEditSuccess}
            />

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-[#1A1825] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20">
                            <Trash2 size={28} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Xóa bài viết?</h3>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                            Thao tác này không thể hoàn tác. Bài viết, hình ảnh, cảm xúc và tất cả bình luận sẽ bị gỡ khỏi hệ
                            thống vĩnh viễn.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-gray-300 font-bold bg-white/5 hover:bg-white/10 transition-colors w-full sm:w-auto"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="px-5 py-2.5 rounded-xl text-white font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-colors flex items-center justify-center w-full sm:w-auto disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 👇 REPORT MODAL */}
            {showReportModal && (
                <ReportModal
                    postId={post.id}
                    onClose={() => setShowReportModal(false)}
                    entityDescription={`bài viết của @${post.userName}`}
                    onSuccess={() => {
                        // Có thể thêm toast thông báo ở đây
                    }}
                />
            )}
        </>
    );
};

export default PostCard;