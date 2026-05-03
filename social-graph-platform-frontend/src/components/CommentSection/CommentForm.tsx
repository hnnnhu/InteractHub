// src/components/CommentSection/CommentForm.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import commentApi from '../../api/commentApi';
import axiosInstance from '../../api/axiosInstance';
import MentionDropdown from '../mention/MentionDropdown';
import type { CommentResponseDto } from '../../types/comment';

interface CommentFormProps {
    postId: string;
    onCommentAdded: (newComment: CommentResponseDto) => void;
    autoFocus?: boolean;
}

const EMOJI_LIST = [
    '😀', '😂', '🥰', '😍', '😎', '😭', '😡',
    '👍', '❤️', '🔥', '✨', '🎉', '💡', '🚀',
];

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded, autoFocus = false }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [imgError, setImgError] = useState(false);

    const [mentionKeyword, setMentionKeyword] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const resolveUrl = (url?: string | null): string | null => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
        const rootUrl = baseURL.replace(/\/api\/?$/, '');
        return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const avatarUrl = resolveUrl(user?.avatarUrl);

    const getInitial = (): string => {
        if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
        if (user?.userName) return user.userName.charAt(0).toUpperCase();
        return 'U';
    };

    useEffect(() => {
        if (autoFocus && textareaRef.current) textareaRef.current.focus();
    }, [autoFocus]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [content]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
                setShowMentionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiClick = (emoji: string) => {
        setContent(prev => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setContent(newValue);

        const cursorPos = e.target.selectionStart || 0;
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const match = textBeforeCursor.match(/@([\w.]*)$/);

        if (match) {
            setMentionKeyword(match[1]);
            const rect = e.target.getBoundingClientRect();
            setMentionPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
            });
            setShowMentionDropdown(true);
        } else {
            setShowMentionDropdown(false);
            setMentionKeyword('');
        }
    };

    const handleMentionSelect = (username: string) => {
        const cursorPos = textareaRef.current?.selectionStart || content.length;
        const textBeforeCursor = content.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        if (lastAtIndex === -1) return;

        const newContent =
            content.substring(0, lastAtIndex) +
            '@' + username + ' ' +
            content.substring(cursorPos);

        setContent(newContent);
        setShowMentionDropdown(false);
        setMentionKeyword('');

        const newCursorPos = lastAtIndex + username.length + 2;
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting || !user) return;

        setIsSubmitting(true);
        try {
            const res = await commentApi.createComment({
                postId,
                content: content.trim(),
                parentCommentId: null
            });

            if (res.isSuccess && res.data?.id) {
                const newComment: CommentResponseDto = {
                    id: res.data.id,
                    postId,
                    userId: user.userId,
                    userName: user.userName,
                    fullName: user.fullName,
                    avatarUrl: resolveUrl(user.avatarUrl),
                    content: content.trim(),
                    parentCommentId: null,
                    replyCount: 0,
                    createdAt: new Date().toISOString(),
                    isEdited: false,
                    replies: []
                };

                onCommentAdded(newComment);
                setContent('');
                setImgError(false);
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
            } else {
                alert(res.message || 'Không thể đăng bình luận.');
            }
        } catch (error) {
            console.error('Lỗi đăng bình luận:', error);
            alert('Không thể đăng bình luận lúc này!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex gap-3 w-full mt-5 pt-4 border-t border-white/[0.08]" ref={containerRef}>
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1A1825] overflow-hidden border border-white/10 shadow-[0_0_10px_rgba(255,20,147,0.1)] transition-all duration-300 hover:border-[#FF1493]/50 hover:shadow-[0_0_15px_rgba(255,20,147,0.2)]">
                    {avatarUrl && !imgError ? (
                        <img
                            src={avatarUrl}
                            alt={user?.fullName || 'Avatar'}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#FF1493] font-bold text-sm">
                            {getInitial()}
                        </div>
                    )}
                </div>
            </div>

            {/* Input area */}
            <div className="flex-1 relative group">
                {/* Glow khi focus */}
                <div className="absolute inset-0 bg-[#4F6BFF]/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative bg-[#1A1825]/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-end focus-within:border-[#4F6BFF]/50 focus-within:bg-[#1A1825] transition-all duration-300 shadow-inner">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Viết bình luận..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 min-h-[46px] max-h-[120px] resize-none focus:outline-none text-[15px] custom-scrollbar leading-relaxed"
                        rows={1}
                    />
                    <div className="flex items-center gap-1 pr-2 pb-2">
                        {/* Emoji picker */}
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-2 text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-full transition-colors"
                            >
                                <Smile size={22} className="transition-transform hover:scale-110" />
                            </button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 mb-3 bg-[#1A1825]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-3 w-[240px] grid grid-cols-6 gap-1 z-50 animate-in zoom-in-95 duration-200">
                                    {EMOJI_LIST.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="text-[22px] hover:bg-white/10 rounded-xl p-1.5 transition-colors flex items-center justify-center hover:scale-110 transform"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Nút gửi */}
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting || !user}
                            className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${!content.trim() || isSubmitting || !user
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-[#4F6BFF] hover:bg-[#4F6BFF]/15 hover:shadow-[0_0_15px_rgba(79,107,255,0.3)] active:scale-90'
                                }`}
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Send size={20} className="ml-[-2px] mt-[1px]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mention dropdown */}
                {showMentionDropdown && (
                    <MentionDropdown
                        key={mentionKeyword}
                        keyword={mentionKeyword}
                        onSelect={handleMentionSelect}
                        onClose={() => setShowMentionDropdown(false)}
                        position={mentionPosition}
                    />
                )}

                {/* Phím tắt */}
                <p className="text-[11px] text-gray-500 mt-1.5 ml-3 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 absolute -bottom-5 whitespace-nowrap">
                    Nhấn <kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300">Enter</kbd> để gửi,{' '}
                    <kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300">Shift + Enter</kbd> để xuống dòng.
                </p>
            </div>
        </div>
    );
};

export default CommentForm;