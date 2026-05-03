// src/components/story/CreateStoryForm.tsx
import React, { useState, useRef, useCallback } from 'react';
import { X, ImagePlus, Lock, Globe, Users, UserCheck, AtSign, Upload } from 'lucide-react';
import { useCreateStory } from '../../hooks/story/useCreateStory';
import { PrivacyLevel } from '../../types/story';
import MentionDropdown from '../mention/MentionDropdown';

interface Props {
    onClose: () => void;
}

export const CreateStoryForm: React.FC<Props> = ({ onClose }) => {
    const { createStory, loading, error } = useCreateStory();
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [privacy, setPrivacy] = useState<number>(PrivacyLevel.Public);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Mention states
    const [mentionKeyword, setMentionKeyword] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);

    const processFile = useCallback((f: File) => {
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setDragOver(false);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        if (f) processFile(f);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) processFile(f);
    }, [processFile]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file && !content.trim()) {
            alert('Vui lòng chọn ảnh/video hoặc nhập nội dung');
            return;
        }
        try {
            await createStory({
                content: content.trim() || undefined,
                mediaFile: file || undefined,
                privacy,
            });
            onClose();
        } catch {
            // lỗi đã được hook ghi nhận
        }
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
            setMentionPosition({ top: rect.bottom + 4, left: rect.left });
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

    const privacyOptions = [
        { value: PrivacyLevel.Public, icon: Globe, label: 'Công khai' },
        { value: PrivacyLevel.FriendsOnly, icon: Users, label: 'Bạn bè' },
        { value: PrivacyLevel.CloseFriends, icon: UserCheck, label: 'Bạn thân' },
        { value: PrivacyLevel.Private, icon: Lock, label: 'Riêng tư' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative bg-[#1A1825] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#1A1825]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-white/5 z-10">
                    <h2 className="text-xl font-bold text-white">Tạo Story mới</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Media upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Ảnh hoặc Video</label>
                        {previewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                {file?.type.startsWith('video') ? (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="w-full h-64 object-cover bg-black"
                                    />
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-64 object-cover bg-black"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${dragOver
                                        ? 'border-[#4F6BFF] bg-[#4F6BFF]/10'
                                        : 'border-white/20 hover:border-[#4F6BFF]/50 hover:bg-[#4F6BFF]/5'
                                    }`}
                            >
                                {dragOver ? (
                                    <>
                                        <Upload className="w-8 h-8 text-[#4F6BFF] mb-2" />
                                        <p className="text-sm text-[#4F6BFF] font-medium">Thả file vào đây</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#4F6BFF]/10 transition-colors">
                                            <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-[#4F6BFF] transition-colors" />
                                        </div>
                                        <p className="text-sm text-gray-400">Nhấn hoặc kéo thả ảnh/video</p>
                                        <p className="text-xs text-gray-500 mt-1">JPG, PNG, MP4 • Tối đa 30MB</p>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Nội dung text */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                            Nội dung <span className="text-gray-500 font-normal">(tùy chọn)</span>
                        </label>
                        <div className="relative">
                            <div className="relative flex items-start bg-[#0D0C13] border border-white/10 rounded-xl focus-within:border-[#4F6BFF]/50 focus-within:ring-1 focus-within:ring-[#4F6BFF]/30 transition-all">
                                <button
                                    type="button"
                                    title="Gắn thẻ (@)"
                                    onClick={() => {
                                        setContent(prev => prev + '@');
                                        textareaRef.current?.focus();
                                    }}
                                    className="pl-4 pt-3 text-gray-500 hover:text-[#4F6BFF] transition-colors"
                                >
                                    <AtSign size={18} />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleContentChange}
                                    maxLength={500}
                                    rows={3}
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-3 resize-none focus:outline-none text-[15px]"
                                    placeholder="Thêm nội dung hoặc gõ @ để gắn thẻ..."
                                />
                            </div>
                            {showMentionDropdown && (
                                <MentionDropdown
                                    keyword={mentionKeyword}
                                    onSelect={handleMentionSelect}
                                    onClose={() => setShowMentionDropdown(false)}
                                    position={mentionPosition}
                                />
                            )}
                            <div className="text-right text-xs text-gray-500 mt-1">{content.length}/500</div>
                        </div>
                    </div>

                    {/* Quyền riêng tư */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Ai có thể xem?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {privacyOptions.map(opt => {
                                const Icon = opt.icon;
                                const active = privacy === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setPrivacy(opt.value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${active
                                                ? 'bg-[#4F6BFF]/20 border-[#4F6BFF]/40 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!file && !content.trim())}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] hover:opacity-90 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF1493]/20"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Đang đăng...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>✨</span> Đăng Story
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};