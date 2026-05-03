// src/components/CommentSection/CommentItem.tsx

import React, { useState, useRef, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { MoreHorizontal, Edit2, Trash2, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import commentApi from '../../api/commentApi';
import axiosInstance from '../../api/axiosInstance';
import useReplies from '../../hooks/useReplies';
import type { CommentResponseDto, CommentReplyDto } from '../../types/comment';
import HashtagLink from '../hashtag/HashtagLink';
import ReplyList from './ReplyList';

interface CommentItemProps {
    comment: CommentResponseDto | CommentReplyDto;
    postId: string;
    isChild?: boolean;
    onDelete?: (id: string) => void;
    onUpdate?: (id: string, newContent: string) => void;
}

// Không cần AuthUserPayload nữa, dùng trực tiếp AuthResponse
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, isChild = false, onDelete, onUpdate }) => {
    const { user } = useAuth();
    const currentUserId = user?.userId;
    const isOwner = Boolean(currentUserId && currentUserId === comment.userId);

    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    const preloadedReplies = ('replies' in comment) ? (comment.replies || []) : [];
    const initialReplyCount = comment.replyCount || 0;

    const {
        replies: displayReplies,
        isLoading: isRepliesLoading,
        hasMore,
        totalCount,
        fetchReplies,
        addReplyToState,
        updateReplyInState,
        deleteReplyFromState
    } = useReplies(comment.id, preloadedReplies, initialReplyCount);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.setSelectionRange(editContent.length, editContent.length);
        }
        if (isReplying && replyInputRef.current) replyInputRef.current.focus();
    }, [isEditing, isReplying, editContent.length]);

    useEffect(() => {
        const actualReplyCount = comment.replyCount || 0;
        const preloadedCount = ('replies' in comment) ? (comment.replies?.length || 0) : 0;
        if (actualReplyCount > preloadedCount && displayReplies.length === 0) fetchReplies();
    }, [comment.id, comment.replyCount, displayReplies.length, fetchReplies, comment]);

    const handleUpdate = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }
        setIsUpdating(true);
        try {
            const res = await commentApi.updateComment(comment.id, editContent.trim());
            if (res.isSuccess) {
                setIsEditing(false);
                onUpdate?.(comment.id, editContent.trim());
            }
        } catch (error: unknown) {
            console.error('Lỗi cập nhật:', error);
            let msg = 'Không thể cập nhật.';
            if (isAxiosError(error) && error.response?.data?.message) msg = error.response.data.message;
            alert(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Xóa bình luận này?')) return;
        try {
            const res = await commentApi.deleteComment(comment.id);
            if (res.isSuccess) onDelete?.(comment.id);
        } catch (error: unknown) {
            console.error('Lỗi xóa:', error);
            let msg = 'Không thể xóa.';
            if (isAxiosError(error) && error.response?.data?.message) msg = error.response.data.message;
            alert(msg);
        }
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || isSubmittingReply || !user) return;
        setIsSubmittingReply(true);
        try {
            const res = await commentApi.createComment({
                postId,
                content: replyContent.trim(),
                parentCommentId: comment.id
            });
            if (res.isSuccess && res.data?.id) {
                const newReply: CommentReplyDto = {
                    id: res.data.id,
                    postId,
                    parentCommentId: comment.id,
                    userId: user.userId,
                    userName: user.userName,
                    fullName: user.fullName,
                    avatarUrl: resolveUrl(user.avatarUrl), // ✅ resolve ảnh
                    content: replyContent.trim(),
                    createdAt: new Date().toISOString(),
                    isEdited: false,
                    replyCount: 0,
                    replies: []
                };
                addReplyToState(newReply);
                setReplyContent('');
                setIsReplying(false);
            }
        } catch (error: unknown) {
            console.error('Lỗi gửi reply:', error);
            let msg = 'Không thể gửi.';
            if (isAxiosError(error) && error.response?.data?.message) msg = error.response.data.message;
            alert(msg);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const renderContentWithHashtags = (text?: string) => {
        if (!text) return null;
        const regex = /(#[\p{L}\p{N}_]+)/gu;
        const parts = text.split(regex);
        return parts.map((part, index) =>
            part.match(regex) ? <HashtagLink key={index} name={part} className="text-[#4F6BFF] hover:text-[#3B54D1] transition-colors hover:underline font-medium" /> : <span key={index}>{part}</span>
        );
    };

    const effectiveTotalCount = Math.max(totalCount, comment.replyCount || 0);

    return (
        <div className={`flex items-start gap-2.5 sm:gap-3 w-full ${isChild ? 'mt-4' : 'mt-6'} animate-in fade-in zoom-in-95 duration-300 group/item`}>
            {/* Avatar */}
            <div className="flex-shrink-0 mt-0.5 z-10 relative">
                <div className={`${isChild ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-9 h-9 sm:w-10 sm:h-10'} rounded-full bg-[#1A1825] overflow-hidden border border-white/10 shadow-sm cursor-pointer hover:border-[#FF1493]/60 hover:shadow-[0_0_10px_rgba(255,20,147,0.3)] transition-all duration-300`}>
                    {comment.avatarUrl ? (
                        <img src={comment.avatarUrl} alt={comment.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#FF1493] font-bold text-[13px] bg-[#1A1825]">
                            {(comment.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Nội dung */}
            <div className="flex-1 min-w-0 flex flex-col items-start">
                <div className="relative group/bubble flex items-start gap-2 w-full">
                    <div className={`relative inline-block max-w-[92%] sm:max-w-[85%] px-4 py-2.5 ${isChild ? 'bg-white/[0.02] rounded-[1.25rem] rounded-tl-sm' : 'bg-[#1A1825]/80 backdrop-blur-md border border-white/5 shadow-sm rounded-[1.25rem] rounded-tl-sm'}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white text-[14px] hover:text-[#FF1493] transition-colors cursor-pointer tracking-wide">{comment.fullName}</span>
                        </div>
                        {isEditing ? (
                            <div className="mt-2 w-full min-w-[220px] sm:min-w-[280px]">
                                <textarea ref={editInputRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-[#0D0C13]/50 border border-white/20 rounded-xl p-3 text-white text-[14px]..." rows={2} />
                                <div className="flex items-center gap-2 mt-3">
                                    <button onClick={handleUpdate} disabled={isUpdating} className="text-xs bg-gradient-to-r from-[#4F6BFF] to-[#3B54D1] text-white px-4 py-2 rounded-lg font-bold...">{isUpdating ? <><Loader2 size={12} className="animate-spin" /> Lưu...</> : 'Lưu lại'}</button>
                                    <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="text-xs text-gray-400...">Hủy</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-200 text-[14.5px] whitespace-pre-wrap break-words leading-relaxed mt-0.5">
                                {renderContentWithHashtags(comment.content)}
                            </div>
                        )}
                    </div>

                    {!isEditing && isOwner && (
                        <div className="relative opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200" ref={menuRef}>
                            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-full mt-1.5 transition-colors"><MoreHorizontal size={18} /></button>
                            {showMenu && (
                                <div className="absolute top-full right-0 sm:left-full sm:top-0 sm:ml-2 mt-1 w-36 bg-[#1A1825]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 z-[60] origin-top-left animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="..."><Edit2 size={14} className="text-[#4F6BFF]" /> Chỉnh sửa</button>
                                    <button onClick={() => { handleDelete(); setShowMenu(false); }} className="..."><Trash2 size={14} /> Xóa</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-3.5 mt-1.5 ml-2 text-[12px] text-gray-500 font-medium select-none">
                        <span className="hover:text-gray-300 cursor-pointer transition-colors">{timeAgo(comment.createdAt)}</span>
                        {comment.isEdited && <span className="italic text-gray-600">(đã chỉnh sửa)</span>}
                        <button onClick={() => setIsReplying(!isReplying)} className={`hover:text-gray-200 transition-colors font-bold ${isReplying ? 'text-white' : ''}`}>Phản hồi</button>
                    </div>
                )}

                {isReplying && (
                    <div className="mt-2.5 flex items-end gap-2 w-full max-w-[90%] relative z-20 animate-in slide-in-from-top-2 duration-200">
                        <textarea ref={replyInputRef} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={`Trả lời ${comment.fullName}...`} className="flex-1 bg-[#1A1825]/60 backdrop-blur-sm border border-white/10 rounded-[1.25rem] px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#FF1493] resize-none h-[42px] custom-scrollbar shadow-inner transition-all" />
                        <button onClick={handleSubmitReply} disabled={!replyContent.trim() || isSubmittingReply} className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-gradient-to-tr from-[#FF1493] to-[#FF4500] text-white flex items-center justify-center...">
                            {isSubmittingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-[-1px] mt-[1px]" />}
                        </button>
                    </div>
                )}

                <div className="w-full">
                    <ReplyList
                        replies={displayReplies}
                        postId={postId}
                        totalReplyCount={effectiveTotalCount}
                        isLoading={isRepliesLoading}
                        hasMore={hasMore}
                        onFetchMore={fetchReplies}
                        onDeleteReply={deleteReplyFromState}
                        onUpdateReply={updateReplyInState}
                    />
                </div>
            </div>
        </div>
    );
};

export default CommentItem;