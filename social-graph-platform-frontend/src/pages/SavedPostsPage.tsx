// src/pages/SavedPostsPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Bookmark, Folder, Trash2, ArrowLeft, LayoutGrid,
    Loader2, Plus, X, Layers, Edit3, BookHeart
} from 'lucide-react';
import savedPostApi from '../api/savedPostApi';
import type { CollectionDto, SavedPostResponseDto } from '../types/savedPost';
import PostCard from '../components/feed/PostCard';
import type { PostSummaryDto } from '../api/postApi';

const FALLBACK_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%231A1825'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236B7280' font-family='system-ui, sans-serif' font-size='12' font-weight='500'%3ELỗi ảnh%3C/text%3E%3C/svg%3E";

const SavedPostsPage: React.FC = () => {
    // --- Data States ---
    const [collections, setCollections] = useState<CollectionDto[]>([]);
    const [posts, setPosts] = useState<SavedPostResponseDto[]>([]);

    // --- View Navigation States ---
    const [isViewingFolders, setIsViewingFolders] = useState<boolean>(true);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

    // --- Loading States ---
    const [isLoading, setIsLoading] = useState(true);
    const [isPostsLoading, setIsPostsLoading] = useState(false);

    // --- Modal States ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [collectionToRename, setCollectionToRename] = useState<string | null>(null);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Sort State ---
    const [sortBy, setSortBy] = useState<'name' | 'count' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // ================= 1. FETCH DATA =================
    const fetchCollections = useCallback(async () => {
        try {
            const response = await savedPostApi.getCollections();
            if (response.isSuccess) {
                const sorted = (response.data || []).sort((a, b) => {
                    if (a.name === "Mặc định") return -1;
                    if (b.name === "Mặc định") return 1;
                    return a.name.localeCompare(b.name);
                });
                setCollections(sorted);
            }
        } catch (err) {
            console.error("Lỗi tải bộ sưu tập:", err);
        }
    }, []);

    const fetchPosts = useCallback(async (collectionName?: string) => {
        setIsPostsLoading(true);
        try {
            const response = await savedPostApi.getSavedPosts(collectionName);
            if (response.isSuccess) {
                setPosts(response.data?.items || []);
            }
        } catch (err) {
            console.error("Lỗi tải bài viết đã lưu:", err);
        } finally {
            setIsPostsLoading(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (isMounted) await Promise.all([fetchCollections(), fetchPosts()]);
        };
        init();
        return () => { isMounted = false; };
    }, [fetchCollections, fetchPosts]);

    // ================= 2. HANDLERS CRUD =================
    const handleSelectCollection = (name: string | null) => {
        setSelectedCollection(name);
        setIsViewingFolders(false);
        fetchPosts(name || undefined);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToFolders = () => {
        setIsViewingFolders(true);
        setSelectedCollection(null);
    };

    const handleDeleteCollection = async (name: string) => {
        if (name === "Mặc định") return;
        if (!window.confirm(`Xóa danh mục "${name}"?\nBài viết bên trong sẽ bị bỏ lưu.`)) return;
        try {
            const res = await savedPostApi.deleteCollection(name);
            if (res.isSuccess) {
                if (selectedCollection === name) handleBackToFolders();
                await fetchCollections();
            }
        } catch (err) {
            console.error("Không thể xóa:", err);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        setIsProcessing(true);
        try {
            const res = await savedPostApi.createCollection({ name: newCollectionName.trim() });
            if (res.isSuccess) {
                await fetchCollections();
                closeModal();
            }
        } finally { setIsProcessing(false); }
    };

    const handleRenameCollection = async () => {
        if (!newCollectionName.trim() || !collectionToRename) return;
        setIsProcessing(true);
        try {
            const res = await savedPostApi.updateCollection(collectionToRename, newCollectionName.trim());
            if (res.isSuccess) {
                await fetchCollections();
                if (selectedCollection === collectionToRename) setSelectedCollection(newCollectionName.trim());
                closeModal();
            }
        } finally { setIsProcessing(false); }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setShowRenameModal(false);
        setNewCollectionName('');
        setCollectionToRename(null);
    };

    // ================= 3. SORT & COMPUTED =================
    const totalSavedCount = useMemo(() => collections.reduce((sum, c) => sum + c.savedPostCount, 0), [collections]);

    const sortedCollections = useMemo(() => {
        const list = [...collections];
        if (!sortBy) return list;

        const multiplier = sortDirection === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            if (sortBy === 'name') return multiplier * a.name.localeCompare(b.name);
            if (sortBy === 'count') return multiplier * (a.savedPostCount - b.savedPostCount);
            return 0;
        });
        return list;
    }, [collections, sortBy, sortDirection]);

    // ================= 4. UTILS & HELPERS =================
    const mapToPostSummary = (sp: SavedPostResponseDto): PostSummaryDto => ({
        id: sp.postId,
        content: sp.postContent,
        userId: sp.userId,
        userName: sp.postAuthorUserName,
        fullName: sp.postAuthorFullName,
        avatarUrl: sp.postAuthorAvatarUrl || null,
        createdAt: sp.postCreatedAt,
        firstMediaUrl: sp.postMediaUrl || null,
        mediaCount: sp.postMediaUrl ? 1 : 0,
        likeCount: 0,
        commentCount: 0,
        isLikedByCurrentUser: false,
        isSavedByCurrentUser: true,
        privacy: 0,
        hashtags: []
    });

    // Sử dụng lastSavedAt từ collection (nếu có) hoặc lấy từ previewPosts theo savedAt
    const formatLastUpdated = (col: CollectionDto): string | null => {
        if (col.lastSavedAt) {
            try {
                const date = new Date(col.lastSavedAt);
                return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
            } catch { /* fallback */ }
        }

        const allPreviewTimes = col.previewPosts
            .filter(p => p?.savedAt)
            .map(p => new Date(p.savedAt).getTime());
        if (allPreviewTimes.length > 0) {
            const latest = new Date(Math.max(...allPreviewTimes));
            return latest.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        }
        return null;
    };

    const renderFolderPreview = (col: CollectionDto) => {
        const mediaPosts = col.previewPosts.filter(p => p?.mediaUrl?.trim());
        if (mediaPosts.length === 0) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 transition-colors">
                    {col.name === "Mặc định" ? (
                        <BookHeart size={44} className="mb-2 opacity-50 drop-shadow-lg text-[#FF1493]" />
                    ) : (
                        <Folder size={44} className="mb-2 opacity-50 drop-shadow-lg" />
                    )}
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-40 mt-1">Trống</span>
                </div>
            );
        }

        if (mediaPosts.length === 1) {
            return (
                <img
                    src={mediaPosts[0].mediaUrl!}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
            );
        }

        const gridPosts = [...mediaPosts.slice(0, 4)];
        while (gridPosts.length < 4) gridPosts.push(null);

        return (
            <div className="absolute inset-0 p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 bg-[#0a090f]">
                {gridPosts.map((p, idx) => {
                    if (!p?.mediaUrl) return <div key={`empty-${idx}`} className="w-full h-full bg-white/5 rounded-xl border border-white/5" />;
                    return (
                        <div key={idx} className="w-full h-full overflow-hidden rounded-xl border border-white/5">
                            <img
                                src={p.mediaUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // ================= 5. RENDER =================
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#111113] flex items-center justify-center pt-24">
                <Loader2 size={40} className="text-[#4F6BFF] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111113] text-white pt-24 pb-8 px-4 sm:px-6 lg:px-8">
            {/* Modal Tạo/Sửa */}
            {(showCreateModal || showRenameModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <div className="bg-[#151221] border border-white/10 p-7 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-[#4F6BFF]/20 blur-3xl rounded-full pointer-events-none" />
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-xl font-extrabold flex items-center gap-2">
                                <Layers size={22} className="text-[#4F6BFF]" />
                                {showRenameModal ? "Đổi tên danh mục" : "Danh mục mới"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10">
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={e => setNewCollectionName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (showRenameModal ? handleRenameCollection() : handleCreateCollection())}
                            placeholder="Tên danh mục..."
                            className="w-full bg-[#0D0C13] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4F6BFF] transition-all mb-6 placeholder-gray-600"
                            autoFocus
                        />
                        <button
                            onClick={showRenameModal ? handleRenameCollection : handleCreateCollection}
                            disabled={isProcessing || !newCollectionName.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F6BFF] to-[#3B4EE1] py-4 rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-[#4F6BFF]/20"
                        >
                            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : (showRenameModal ? "Lưu thay đổi" : "Tạo danh mục")}
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        {!isViewingFolders && (
                            <button
                                onClick={handleBackToFolders}
                                className="p-3 bg-[#151221] hover:bg-white/10 rounded-full border border-white/5 group"
                            >
                                <ArrowLeft size={22} className="text-gray-400 group-hover:text-white" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                {isViewingFolders && (
                                    <Bookmark size={32} className="text-[#FF1493] drop-shadow-[0_0_15px_rgba(255,20,147,0.5)]" />
                                )}
                                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
                                    {isViewingFolders ? "Kho lưu trữ" : (selectedCollection || "Tất cả bài viết")}
                                </span>
                            </h1>
                            <p className="text-gray-500 text-[15px] mt-1.5 font-medium">
                                {isViewingFolders ? "Quản lý những nội dung bạn đã lưu" : `Đang xem danh mục ${selectedCollection || ''}`}
                            </p>
                        </div>
                    </div>

                    {isViewingFolders && (
                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <select
                                value={`${sortBy || ''}-${sortDirection}`}
                                onChange={e => {
                                    const [newSort, newDir] = e.target.value.split('-');
                                    if (!newSort) {
                                        setSortBy(null);
                                        setSortDirection('asc');
                                    } else {
                                        setSortBy(newSort as 'name' | 'count');
                                        setSortDirection(newDir as 'asc' | 'desc');
                                    }
                                }}
                                className="bg-[#151221] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300 focus:outline-none focus:border-[#4F6BFF]"
                            >
                                <option value="">Mặc định</option>
                                <option value="name-asc">Tên A-Z</option>
                                <option value="name-desc">Tên Z-A</option>
                                <option value="count-desc">Nhiều bài nhất</option>
                                <option value="count-asc">Ít bài nhất</option>
                            </select>
                        </div>
                    )}
                </header>

                {/* Grid Folders */}
                {isViewingFolders ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Card "Tất cả" */}
                        <div
                            onClick={() => handleSelectCollection(null)}
                            className="group bg-[#151221] border border-white/5 hover:border-[#4F6BFF]/30 p-4 sm:p-5 rounded-[2rem] cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(79,107,255,0.15)] hover:-translate-y-1 flex flex-col h-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F6BFF]/10 blur-3xl rounded-full group-hover:bg-[#4F6BFF]/20 transition-all" />
                            <div className="aspect-square w-full bg-gradient-to-br from-[#1A1825] to-[#0D0C13] rounded-2xl flex items-center justify-center border border-white/5 mb-4 relative z-10">
                                <LayoutGrid size={48} className="text-gray-500 group-hover:text-[#4F6BFF] transition-all group-hover:scale-110" />
                            </div>
                            <div className="mt-auto relative z-10">
                                <h3 className="font-bold text-lg text-gray-200 group-hover:text-white truncate">Tất cả bài viết</h3>
                                <p className="text-[13px] text-gray-500 mt-1">{totalSavedCount} bài viết</p>
                            </div>
                        </div>

                        {/* Card từng collection */}
                        {sortedCollections.map(col => {
                            const lastUpdated = formatLastUpdated(col);
                            return (
                                <div
                                    key={col.name}
                                    onClick={() => handleSelectCollection(col.name)}
                                    className="group bg-[#151221] border border-white/5 hover:border-white/15 p-4 sm:p-5 rounded-[2rem] cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="aspect-square w-full bg-[#1A1825] rounded-2xl overflow-hidden border border-white/5 mb-4 relative group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                        {renderFolderPreview(col)}
                                        {col.name === "Mặc định" && (
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                                                <BookHeart size={14} className="text-[#FF1493]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-3 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-bold text-[16px] sm:text-lg truncate ${col.name === 'Mặc định' ? 'text-[#FF1493]' : 'text-gray-200 group-hover:text-white'}`}>
                                                {col.name}
                                            </h3>
                                            <p className="text-[13px] text-gray-500 mt-1 font-medium">
                                                {col.savedPostCount} bài viết
                                                {lastUpdated && (
                                                    <span className="ml-2 text-gray-600">· {lastUpdated}</span>
                                                )}
                                            </p>
                                        </div>
                                        {col.name !== "Mặc định" && (
                                            <div className="flex flex-shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setCollectionToRename(col.name); setNewCollectionName(col.name); setShowRenameModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-[#4F6BFF] bg-white/5 hover:bg-[#4F6BFF]/10 rounded-xl"
                                                    title="Đổi tên"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleDeleteCollection(col.name); }}
                                                    className="p-2 text-gray-400 hover:text-[#FF1493] bg-white/5 hover:bg-[#FF1493]/10 rounded-xl"
                                                    title="Xóa danh mục"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Card placeholder "Tạo mới" */}
                        <div
                            onClick={() => { setNewCollectionName(''); setShowCreateModal(true); }}
                            className="group bg-[#151221]/50 border border-dashed border-white/10 hover:border-[#4F6BFF]/40 p-4 sm:p-5 rounded-[2rem] cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,107,255,0.2)] hover:-translate-y-1 flex flex-col items-center justify-center h-full min-h-[220px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#4F6BFF]/10 transition-all">
                                <Plus size={28} className="text-gray-500 group-hover:text-[#4F6BFF] group-hover:rotate-90 transition-all duration-300" />
                            </div>
                            <span className="font-semibold text-gray-400 group-hover:text-white text-center text-sm">
                                Tạo danh mục mới
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Chế độ xem bài viết */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isPostsLoading ? (
                            <div className="flex justify-center py-32">
                                <Loader2 size={40} className="animate-spin text-[#4F6BFF]" />
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="max-w-2xl mx-auto space-y-6 pb-20">
                                {posts.map(sp => (
                                    <div key={sp.id} className="animate-in zoom-in-95 duration-300">
                                        <PostCard
                                            post={mapToPostSummary(sp)}
                                            onLikeChange={() => fetchPosts(selectedCollection || undefined)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 px-4 bg-[#151221] rounded-[2.5rem] border border-white/5 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#4F6BFF]/5 blur-3xl rounded-full pointer-events-none" />
                                <div className="w-24 h-24 bg-[#1A1825] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner relative z-10">
                                    <Folder size={40} className="text-[#4F6BFF]/80" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Thư mục trống</h3>
                                <p className="text-gray-400 text-[15px] mb-8 max-w-md mx-auto relative z-10">
                                    {selectedCollection
                                        ? `Chưa có bài viết nào trong "${selectedCollection}".`
                                        : "Bạn chưa lưu bài viết nào."}
                                    Hãy khám phá bảng tin và lưu lại những nội dung hay!
                                </p>
                                <button
                                    onClick={handleBackToFolders}
                                    className="px-8 py-3.5 bg-white/5 hover:bg-white/10 rounded-full text-[15px] font-bold text-white border border-white/10 hover:border-white/20 active:scale-95 relative z-10"
                                >
                                    Quay lại danh mục
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedPostsPage;