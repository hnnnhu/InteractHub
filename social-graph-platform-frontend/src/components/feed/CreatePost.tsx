// src/components/feed/CreatePost.tsx

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import useUserProfile from '../../hooks/useUserProfile';
import { isAxiosError } from 'axios';
import {
    Image as ImageIcon,
    Smile,
    Send,
    Loader2,
    Video,
    Globe,
    Users,
    Lock,
    ChevronDown,
    X,
    Hash,
    AtSign,
} from 'lucide-react';
import postApi, { PrivacyLevel, resolveMediaUrl } from '../../api/postApi';
import type { PostSummaryDto } from '../../api/postApi';
import MentionDropdown from '../mention/MentionDropdown';

interface CreatePostProps {
    onPostCreated: (post: PostSummaryDto) => void;
}

interface AuthUserPayload {
    id?: string;
    userId?: string;
    userName?: string;
    fullName?: string;
    avatarUrl?: string | null;
    [key: string]: unknown;
}

const EMOJI_LIST = [
    '😀', '😂', '🥰', '😍', '😎', '😭', '😡',
    '👍', '❤️', '🔥', '✨', '🎉', '💡', '🚀',
];

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
    const { user } = useAuth();

    // Lấy thông tin profile mới nhất (bao gồm avatar) từ server
    const { profile } = useUserProfile('me', 'me');

    // States
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [privacy, setPrivacy] = useState<number>(PrivacyLevel.Public);
    const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<
        { file: File; previewUrl: string; type: 'image' | 'video' }[]
    >([]);
    const [imgError, setImgError] = useState(false);

    // Mention states
    const [mentionKeyword, setMentionKeyword] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Avatar URL hiện tại, được resolve bằng hàm chuẩn từ postApi
    const avatarUrl = resolveMediaUrl(profile?.avatarUrl ?? user?.avatarUrl);

    const getInitial = (): string => {
        const displayName = profile?.fullName || user?.fullName || user?.userName || 'U';
        return displayName.charAt(0).toUpperCase();
    };

    // Auto‑resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                200
            )}px`;
        }
    }, [content]);

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                containerRef.current?.contains(target) ||
                target.closest('[data-mention-dropdown]')
            ) {
                return;
            }

            if (content.trim() === '' && selectedMedia.length === 0) {
                setIsExpanded(false);
            }
            setShowPrivacyMenu(false);
            setShowEmojiPicker(false);
            setShowMentionDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [content, selectedMedia]);

    // Cleanup media preview URLs
    useEffect(() => {
        return () => {
            selectedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
        };
    }, [selectedMedia]);

    // Handlers
    const extractHashtags = (text: string) => {
        const regex = /#[\p{L}\p{N}_]+/gu;
        const matches = text.match(regex) || [];
        const cleanedTags = matches.map((tag) => tag.replace(/^#/, ''));
        return Array.from(new Set(cleanedTags));
    };
    const detectedHashtags = extractHashtags(content);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'image' | 'video'
    ) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            const newMedia = filesArray.map((file) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                type,
            }));
            setSelectedMedia((prev) => [...prev, ...newMedia]);
            setIsExpanded(true);
        }
        if (e.target) e.target.value = '';
    };

    const removeMedia = (indexToRemove: number) => {
        setSelectedMedia((prev) => {
            const newMedia = [...prev];
            URL.revokeObjectURL(newMedia[indexToRemove].previewUrl);
            newMedia.splice(indexToRemove, 1);
            return newMedia;
        });
    };

    const handleEmojiClick = (emoji: string) => {
        setContent((prev) => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    // Mention logic
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
                top: rect.bottom + 4,
                left: rect.left,
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

    // Submit
    const handleSubmit = async () => {
        if ((!content.trim() && selectedMedia.length === 0) || !user || isLoading) return;

        setIsLoading(true);
        try {
            let uploadedUrls: string[] = [];
            if (selectedMedia.length > 0) {
                const filesToUpload = selectedMedia.map((m) => m.file);
                uploadedUrls = await postApi.uploadMedia(filesToUpload);
                if (uploadedUrls.length === 0) {
                    setIsLoading(false);
                    return;
                }
            }

            const response = await postApi.createPost({
                content: content.trim(),
                privacy,
                mediaUrls: uploadedUrls,
                hashtags: detectedHashtags,
            });

            if (response.isSuccess && response.data?.id) {
                const safeUser = user as unknown as AuthUserPayload;
                const newPost: PostSummaryDto = {
                    id: response.data.id,
                    userId: safeUser?.id || safeUser?.userId || '',
                    userName: safeUser?.userName || '',
                    fullName: safeUser?.fullName || 'Người dùng',
                    avatarUrl: avatarUrl || null,
                    content: content.trim(),
                    privacy,
                    createdAt: new Date().toISOString(),
                    firstMediaUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
                    mediaCount: uploadedUrls.length,
                    likeCount: 0,
                    commentCount: 0,
                    isLikedByCurrentUser: false,
                    isSavedByCurrentUser: false,
                    hashtags: detectedHashtags,
                };
                onPostCreated(newPost);
                setContent('');
                setSelectedMedia([]);
                setIsExpanded(false);
            }
        } catch (error: unknown) {
            let errorDetail = 'Lỗi kết nối không xác định';
            if (isAxiosError(error) && error.response) {
                if (error.response.data?.errors) {
                    errorDetail = Object.values(error.response.data.errors).flat().join('\n');
                } else if (error.response.data?.message) {
                    errorDetail = error.response.data.message;
                } else if (error.response.data?.title) {
                    errorDetail = error.response.data.title;
                }
            } else if (error instanceof Error) {
                errorDetail = error.message;
            }
            console.error('Tạo bài viết thất bại:', errorDetail);
            alert(`Không thể đăng bài viết.\n\nChi tiết: ${errorDetail}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Privacy options
    const privacyOptions = [
        { value: PrivacyLevel.Public, icon: Globe, label: 'Công khai' },
        { value: PrivacyLevel.FriendsOnly, icon: Users, label: 'Bạn bè' },
        { value: PrivacyLevel.CloseFriends, icon: Users, label: 'Bạn thân' },
        { value: PrivacyLevel.Private, icon: Lock, label: 'Chỉ mình tôi' },
    ];
    const currentPrivacy = privacyOptions.find((opt) => opt.value === privacy) ?? privacyOptions[0];
    const safeUserForUI = user as unknown as AuthUserPayload | null;
    const firstName = safeUserForUI?.fullName?.split(' ').pop() ?? safeUserForUI?.userName ?? 'bạn';

    return (
        <div
            ref={containerRef}
            className="group relative bg-[#0D0C13]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 mb-8 shadow-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl"
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#4F6BFF]/5 to-[#FF1493]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex gap-4 relative z-10">
                {/* Avatar + pulse */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-[#FF1493]/30 p-[2px] group/avatar cursor-pointer">
                        <div className="w-full h-full bg-[#1A1825] rounded-full overflow-hidden flex items-center justify-center">
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    alt={profile?.fullName || user?.fullName || 'Avatar'}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-[#FF1493] font-bold text-lg">{getInitial()}</span>
                            )}
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="absolute inset-0 rounded-full border border-[#FF1493]/20 animate-ping pointer-events-none" />
                    )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Header (tên & quyền riêng tư) */}
                    <div
                        className={`flex items-center gap-2 mb-3 transition-all duration-300 ${isExpanded ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                            }`}
                    >
                        <span className="text-white font-bold text-sm truncate">
                            {safeUserForUI?.fullName}
                        </span>

                        <div className="relative">
                            <button
                                onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/5 transition-colors"
                            >
                                <currentPrivacy.icon className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-300 font-medium">
                                    {currentPrivacy.label}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            </button>

                            {showPrivacyMenu && (
                                <div className="absolute top-8 left-0 mt-1 w-48 bg-[#1A1825] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                                    <div className="px-3 pb-2 mb-2 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Ai có thể xem?
                                    </div>
                                    {privacyOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setPrivacy(opt.value);
                                                setShowPrivacyMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${privacy === opt.value ? 'text-[#FF1493] bg-[#FF1493]/5' : 'text-gray-300'
                                                }`}
                                        >
                                            <opt.icon
                                                className={`w-4 h-4 ${privacy === opt.value ? 'text-[#FF1493]' : 'text-gray-400'}`}
                                            />
                                            <span className="text-sm font-medium">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onFocus={() => setIsExpanded(true)}
                        placeholder={`${firstName} ơi, bạn đang nghĩ gì? (Gõ #hashtag hoặc @tên để gắn thẻ)`}
                        rows={isExpanded ? 3 : 1}
                        className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-[16px] leading-relaxed custom-scrollbar transition-all duration-300"
                    />

                    {/* Mention dropdown */}
                    {showMentionDropdown &&
                        createPortal(
                            <MentionDropdown
                                key={mentionKeyword}
                                keyword={mentionKeyword}
                                onSelect={handleMentionSelect}
                                onClose={() => setShowMentionDropdown(false)}
                                position={mentionPosition}
                            />,
                            document.body
                        )
                    }

                    {/* Hashtag chips */}
                    {isExpanded && detectedHashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {detectedHashtags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4F6BFF] bg-[#4F6BFF]/10 px-3 py-1.5 rounded-lg border border-[#4F6BFF]/20 hover:bg-[#4F6BFF]/20 transition-colors cursor-pointer"
                                >
                                    <Hash size={13} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media previews */}
                    {selectedMedia.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 relative z-0 animate-in fade-in duration-300">
                            {selectedMedia.map((media, idx) => (
                                <div
                                    key={idx}
                                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group/media"
                                >
                                    {media.type === 'image' ? (
                                        <img
                                            src={media.previewUrl}
                                            alt="preview"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-110"
                                        />
                                    ) : (
                                        <video
                                            src={media.previewUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                        />
                                    )}
                                    <button
                                        onClick={() => removeMedia(idx)}
                                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/media:opacity-100 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                    {media.type === 'video' && (
                                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                            <Video size={10} /> Video
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action bar */}
                    <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                            }`}
                    >
                        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Media & emoji buttons */}
                            <div className="flex items-center gap-1">
                                <input type="file" ref={imageInputRef} hidden accept="image/*" multiple onChange={(e) => handleFileChange(e, 'image')} />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    type="button"
                                    title="Thêm ảnh"
                                    className="p-2 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 rounded-full transition-all group/btn"
                                >
                                    <ImageIcon size={20} className="transition-transform group-hover/btn:scale-110" />
                                </button>

                                <input type="file" ref={videoInputRef} hidden accept="video/*" multiple onChange={(e) => handleFileChange(e, 'video')} />
                                <button
                                    onClick={() => videoInputRef.current?.click()}
                                    type="button"
                                    title="Thêm video"
                                    className="p-2 text-[#FF1493] hover:bg-[#FF1493]/10 rounded-full transition-all group/btn"
                                >
                                    <Video size={20} className="transition-transform group-hover/btn:scale-110" />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        type="button"
                                        title="Thêm cảm xúc"
                                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-full transition-all group/btn"
                                    >
                                        <Smile size={20} className="transition-transform group-hover/btn:scale-110" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full left-0 mb-2 bg-[#1A1825] border border-white/10 rounded-xl shadow-2xl p-2 w-48 grid grid-cols-7 gap-1 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                            {EMOJI_LIST.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleEmojiClick(emoji)}
                                                    className="text-lg hover:bg-white/10 rounded-lg p-1 transition-colors hover:scale-110 transform"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    title="Gắn thẻ (@)"
                                    onClick={() => {
                                        setIsExpanded(true);
                                        setContent((prev) => prev + '@');
                                        setTimeout(() => textareaRef.current?.focus(), 10);
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#4F6BFF] hover:bg-white/5 rounded-full transition-all"
                                >
                                    <AtSign size={18} />
                                </button>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={(!content.trim() && selectedMedia.length === 0) || isLoading}
                                className={`
                  w-full sm:w-auto px-6 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg
                  ${!content.trim() && selectedMedia.length === 0
                                        ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                        : 'bg-gradient-to-r from-[#4F6BFF] to-[#FF1493] text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,20,147,0.3)] border border-transparent hover:scale-[1.02] active:scale-[0.98]'
                                    }
                `}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin w-4 h-4" /> Đang đăng...
                                    </>
                                ) : (
                                    <>
                                        Đăng bài <Send className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;