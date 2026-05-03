// src/components/feed/EditPostModal.tsx

import React, { useState } from 'react';
import { X, Globe, Users, Lock, Loader2 } from 'lucide-react';
import postApi, { PrivacyLevel } from '../../api/postApi';
import { isAxiosError } from 'axios';

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    initialContent: string;
    initialPrivacy: number;
    onSuccess: (newContent: string, newPrivacy: number) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
    isOpen,
    onClose,
    postId,
    initialContent,
    initialPrivacy,
    onSuccess
}) => {
    const [content, setContent] = useState(initialContent || '');
    const [privacy, setPrivacy] = useState(initialPrivacy);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim()) {
            alert('Nội dung bài viết không được để trống.');
            return;
        }

        setIsSubmitting(true);
        try {
            await postApi.updatePost({
                postId,
                content,
                privacy
            });
            onSuccess(content, privacy);
            onClose();
        } catch (error: unknown) {
            console.error('Lỗi khi cập nhật bài viết:', error);
            let errorMessage = 'Không thể cập nhật bài viết!';
            if (isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-[#1A1825] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Chỉnh sửa bài viết</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-4">
                    {/* Quyền riêng tư */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Quyền riêng tư</label>
                        <div className="relative">
                            <select
                                value={privacy}
                                onChange={(e) => setPrivacy(Number(e.target.value))}
                                className="w-full appearance-none bg-[#0D0C13] border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] focus:border-transparent transition-all"
                            >
                                <option value={PrivacyLevel.Public}>Công khai</option>
                                <option value={PrivacyLevel.FriendsOnly}>Bạn bè</option>
                                <option value={PrivacyLevel.CloseFriends}>Bạn thân</option>
                                <option value={PrivacyLevel.Private}>Chỉ mình tôi</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                {privacy === PrivacyLevel.Public && <Globe size={18} />}
                                {(privacy === PrivacyLevel.FriendsOnly || privacy === PrivacyLevel.CloseFriends) && <Users size={18} />}
                                {privacy === PrivacyLevel.Private && <Lock size={18} />}
                            </div>
                        </div>
                    </div>

                    {/* Nội dung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nội dung bài viết</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className="w-full bg-[#0D0C13] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] focus:border-transparent transition-all resize-none"
                            placeholder="Bạn đang nghĩ gì?"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl text-gray-300 font-medium hover:bg-white/10 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-[#4F6BFF] text-white font-medium hover:bg-[#4F6BFF]/80 transition-all flex items-center disabled:opacity-50"
                    >
                        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang lưu...</> : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPostModal;