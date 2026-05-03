// src/components/search/GlobalSearchDropdown.tsx

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search,
    X,
    Loader2,
    User,
    Hash,
    FileText,
    ChevronRight,
    History,
    TrendingUp,
    Sparkles
} from 'lucide-react';
import useGlobalSearch from '../../hooks/useGlobalSearch';

const GlobalSearchDropdown: React.FC = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const {
        keyword,
        setKeyword,
        results,
        isLoading,
        clearSearch
    } = useGlobalSearch(500);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const hasResults = results.users.length > 0 || results.hashtags.length > 0 || results.posts.length > 0;

    return (
        <div className="relative w-full max-w-md z-[100]" ref={dropdownRef}>

            {/* --- Thanh tìm kiếm (Input Box) --- */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isLoading ? (
                        <Loader2 size={18} className="text-[#4F6BFF] animate-spin" />
                    ) : (
                        <Search size={18} className="text-gray-400 group-focus-within:text-[#4F6BFF] transition-colors" />
                    )}
                </div>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                        setKeyword(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Tìm kiếm người dùng, chủ đề..."
                    className="w-full pl-11 pr-10 py-2.5 bg-[#12101A]/80 backdrop-blur-md border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]/50 focus:bg-[#1A1825] transition-all shadow-inner"
                />
                {keyword && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-[#FF1493] transition-colors focus:outline-none"
                    >
                        <div className="p-1 hover:bg-[#FF1493]/10 rounded-full transition-colors">
                            <X size={16} />
                        </div>
                    </button>
                )}
            </div>

            {/* --- Dropdown kết quả (Glassmorphism Modal) --- */}
            {isOpen && (
                <div className="absolute mt-3 w-full bg-[#0D0C13]/95 border border-white/10 rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* 1. Trạng thái Trống (Khi chưa nhập gì - Lịch sử/Gợi ý) */}
                    {!keyword.trim() && (
                        <div className="p-5">
                            <div className="flex items-center gap-2 text-[11px] font-black text-[#4F6BFF] uppercase tracking-widest mb-4 px-1">
                                <TrendingUp size={14} />
                                Xu hướng tìm kiếm
                            </div>
                            <div className="space-y-1.5">
                                {['#congnghe', '#thietke', 'SocialNetwork'].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setKeyword(item)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all group"
                                    >
                                        <History size={16} className="text-gray-600 group-hover:text-[#4F6BFF] transition-colors" />
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Trạng thái Loading (Khi đang gọi API) */}
                    {isLoading && keyword.trim() && (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                            <div className="relative mb-3">
                                <div className="absolute inset-0 bg-[#4F6BFF] blur-xl opacity-20 animate-pulse" />
                                <Loader2 size={32} className="animate-spin text-[#4F6BFF] relative z-10" />
                            </div>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Đang truy xuất...</p>
                        </div>
                    )}

                    {/* 3. Hiển thị kết quả */}
                    {!isLoading && keyword.trim() && (
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                            {hasResults ? (
                                <>
                                    {/* --- PHÂN ĐOẠN: NGƯỜI DÙNG (Màu Xanh Blue) --- */}
                                    {results.users.length > 0 && (
                                        <section className="mb-2">
                                            <div className="px-5 py-2.5 text-[10px] font-black text-[#4F6BFF] uppercase tracking-[0.2em] flex items-center gap-2">
                                                <User size={12} />
                                                <span>Thành viên</span>
                                            </div>
                                            {results.users.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleItemClick(`/profile/${user.userName}`)}
                                                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors group"
                                                >
                                                    {/* AVATAR VỚI CHỨC NĂNG FALLBACK HOÀN CHỈNH */}
                                                    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-[#1A1825] border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#4F6BFF]/50 transition-colors">
                                                        {user.avatarUrl ? (
                                                            <img
                                                                src={user.avatarUrl}
                                                                alt={user.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Nếu ảnh lỗi, gọi UI-Avatars làm ảnh thay thế
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=4F6BFF&color=fff&bold=true`;
                                                                }}
                                                            />
                                                        ) : (
                                                            // Nếu không có link ảnh, hiển thị chữ cái đầu
                                                            <span className="text-[#4F6BFF] font-black text-sm">
                                                                {(user.fullName || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-left flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white truncate group-hover:text-[#4F6BFF] transition-colors">{user.fullName}</p>
                                                        <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">@{user.userName}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </button>
                                            ))}
                                        </section>
                                    )}

                                    {/* --- PHÂN ĐOẠN: HASHTAGS (Màu Hồng) --- */}
                                    {results.hashtags.length > 0 && (
                                        <section className="mb-2">
                                            <div className="px-5 py-3 text-[10px] font-black text-[#FF1493] uppercase tracking-[0.2em] flex items-center gap-2 border-t border-white/5">
                                                <Hash size={12} />
                                                <span>Chủ đề</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 px-5 py-1 mb-2">
                                                {results.hashtags.map((tag) => (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => handleItemClick(`/hashtag/${tag.name}`)}
                                                        className="px-3.5 py-1.5 bg-[#FF1493]/10 border border-[#FF1493]/20 rounded-lg text-[11px] font-bold text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all shadow-sm"
                                                    >
                                                        #{tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* --- PHÂN ĐOẠN: BÀI VIẾT (Màu Xanh Ngọc) --- */}
                                    {results.posts.length > 0 && (
                                        <section>
                                            <div className="px-5 py-3 text-[10px] font-black text-[#00FF9F] uppercase tracking-[0.2em] flex items-center gap-2 border-t border-white/5">
                                                <FileText size={12} />
                                                <span>Bài viết</span>
                                            </div>
                                            {results.posts.map((post) => (
                                                <button
                                                    key={post.id}
                                                    onClick={() => handleItemClick(`/post/${post.id}`)}
                                                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#00FF9F] group-hover:bg-[#00FF9F]/10 transition-all border border-white/5 group-hover:border-[#00FF9F]/30 shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-300 line-clamp-1">"{post.content || 'Bài viết đính kèm hình ảnh/video'}"</p>
                                                        <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-wider">
                                                            {post.fullName} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </section>
                                    )}
                                </>
                            ) : (
                                /* Trạng thái báo rỗng khi search không ra kết quả */
                                <div className="p-12 text-center animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <Search size={28} className="text-gray-600" />
                                    </div>
                                    <p className="text-white font-bold text-base">Không có dữ liệu</p>
                                    <p className="text-[12px] text-gray-500 mt-1.5 font-medium">Hãy thử tìm kiếm với từ khóa khác.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Footer: Link tới trang tìm kiếm chi tiết --- */}
                    {keyword.trim() && hasResults && !isLoading && (
                        <div className="p-3 border-t border-white/10 bg-[#0A0A0F]/50">
                            <Link
                                to={`/search?q=${encodeURIComponent(keyword)}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-3 text-[11px] font-black tracking-widest uppercase text-white bg-gradient-to-r from-[#4F6BFF] to-[#3b52d6] hover:brightness-110 rounded-xl transition-all shadow-[0_0_15px_rgba(79,107,255,0.4)]"
                            >
                                <Sparkles size={14} />
                                Xem toàn bộ kết quả
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearchDropdown;