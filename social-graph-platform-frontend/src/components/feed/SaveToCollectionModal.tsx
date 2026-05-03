// src/components/feed/SaveToCollectionModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Folder, Plus, Loader2, Bookmark, CheckCircle2 } from 'lucide-react';
import savedPostApi from '../../api/savedPostApi';
import type { CollectionDto } from '../../types/savedPost';

interface SaveToCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onSaveSuccess: (collectionName: string) => void;
}

const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
    isOpen,
    onClose,
    postId,
    onSaveSuccess
}) => {
    const [collections, setCollections] = useState<CollectionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State chọn collection hiện có
    const [selectedCollection, setSelectedCollection] = useState<string>("Mặc định");

    // State quản lý việc tạo danh mục mới
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // Hàm xử lý đóng Modal và dọn dẹp State (Thay thế cho logic trong useEffect cũ)
    const handleModalClose = () => {
        setIsCreatingNew(false);
        setNewCollectionName('');
        onClose();
    };

    // Fetch danh sách bộ sưu tập mỗi khi mở Modal
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchCollections = async () => {
            setIsLoading(true);
            try {
                const response = await savedPostApi.getCollections();
                if (response.isSuccess && isMounted) {
                    const sorted = (response.data || []).sort((a, b) => {
                        if (a.name === "Mặc định") return -1;
                        if (b.name === "Mặc định") return 1;
                        return a.name.localeCompare(b.name);
                    });
                    setCollections(sorted);

                    // Mặc định chọn thư mục đầu tiên (thường là "Mặc định")
                    if (sorted.length > 0) {
                        setSelectedCollection(sorted[0].name);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bộ sưu tập:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchCollections();

        return () => { isMounted = false; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Hàm xử lý lưu bài viết
    const handleSavePost = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            let finalCollectionName = selectedCollection;

            // Xử lý nếu người dùng đang nhập tên danh mục mới
            if (isCreatingNew && newCollectionName.trim()) {
                finalCollectionName = newCollectionName.trim();

                // 1. Gửi yêu cầu tạo danh mục mới lên Backend
                const createRes = await savedPostApi.createCollection({ name: finalCollectionName });
                if (!createRes.isSuccess) {
                    throw new Error(createRes.message || "Không thể tạo danh mục mới");
                }
            }

            // 2. Lưu bài viết vào danh mục đã chọn/vừa tạo
            const response = await savedPostApi.savePost({
                postId,
                collectionName: finalCollectionName
            });

            if (response.isSuccess) {
                // Trả về tên danh mục cho PostCard để đồng bộ UI
                onSaveSuccess(finalCollectionName);
                handleModalClose();
            } else {
                alert(response.message || "Lưu bài viết thất bại");
            }
        } catch (error) {
            console.error("Lỗi thực thi lưu bài viết:", error);
            const errorMsg = error.response?.data?.message || error.message || "Đã xảy ra lỗi.";
            alert(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-[#151221] border border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">

                {/* Hiệu ứng ánh sáng header */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-[#FFB800]/20 blur-3xl rounded-full pointer-events-none"></div>

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bookmark className="text-[#FFB800] fill-[#FFB800]/20" size={22} />
                        Lưu vào danh mục
                    </h2>
                    <button
                        onClick={handleModalClose}
                        className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY: Danh sách bộ sưu tập */}
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 min-h-[200px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                            <Loader2 className="animate-spin text-[#FFB800]" size={32} />
                            <span className="text-sm font-medium">Đang tải danh sách...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {!isCreatingNew && collections.map((col) => (
                                <div
                                    key={col.name}
                                    onClick={() => setSelectedCollection(col.name)}
                                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${selectedCollection === col.name
                                            ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_15px_rgba(255,184,0,0.15)]'
                                            : 'bg-[#1A1825] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <Folder size={20} className={selectedCollection === col.name ? "text-[#FFB800]" : "text-gray-400"} />
                                        <div>
                                            <p className={`font-semibold ${selectedCollection === col.name ? 'text-white' : 'text-gray-200'}`}>
                                                {col.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{col.savedPostCount} bài viết</p>
                                        </div>
                                    </div>
                                    {selectedCollection === col.name && (
                                        <CheckCircle2 size={20} className="text-[#FFB800]" />
                                    )}
                                </div>
                            ))}

                            {/* Form/Nút tạo danh mục mới */}
                            {!isCreatingNew ? (
                                <button
                                    onClick={() => setIsCreatingNew(true)}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-gray-300 font-medium transition-all group"
                                >
                                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                    Tạo danh mục mới
                                </button>
                            ) : (
                                <div className="bg-[#1A1825] p-4 rounded-2xl border border-[#4F6BFF]/50 shadow-[0_0_15px_rgba(79,107,255,0.1)] animate-in slide-in-from-top-2">
                                    <p className="text-sm text-gray-400 mb-2 font-medium">Tên danh mục mới:</p>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSavePost()}
                                        placeholder="Ví dụ: Công nghệ, Đồ ăn..."
                                        className="w-full bg-[#0D0C13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-all mb-4"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => { setIsCreatingNew(false); setNewCollectionName(''); }}
                                            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSavePost}
                                            disabled={!newCollectionName.trim() || isSaving}
                                            className="px-5 py-2 rounded-xl text-sm font-bold bg-[#4F6BFF] hover:bg-[#5b75ff] text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#4F6BFF]/20"
                                        >
                                            {isSaving && <Loader2 size={14} className="animate-spin" />}
                                            Tạo & Lưu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER: Nút lưu nếu không ở chế độ tạo mới */}
                {!isCreatingNew && (
                    <div className="p-6 border-t border-white/5 bg-[#151221]">
                        <button
                            onClick={handleSavePost}
                            disabled={isSaving || isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFB800] to-[#E5A600] hover:brightness-110 text-black py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-50 shadow-xl shadow-[#FFB800]/10 active:scale-[0.98]"
                        >
                            {isSaving ? <Loader2 size={24} className="animate-spin" /> : "Lưu bài viết"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SaveToCollectionModal;