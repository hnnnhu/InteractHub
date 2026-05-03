// src/pages/FriendRequestsPage.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Send,
    ArrowLeft,
    Loader2,
    UserCheck,
    Search,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import usePendingRequests from '../hooks/usePendingRequests';
import useSentRequests from '../hooks/useSentRequests';
import FriendRequestItem from '../components/friends/FriendRequestItem';
import SentRequestItem from '../components/friends/SentRequestItem';

const FriendRequestsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    const {
        requests: pendingRequests,
        isLoading: loadingPending,
        isLoadingMore: loadingMorePending,
        hasMore: hasMorePending,
        totalCount: pendingCount,
        error: pendingError,
        loadMore: loadMorePending,
        removeRequestFromState: removePending,
        fetchFirstPage: refetchPending,
    } = usePendingRequests(20);

    const {
        requests: sentRequests,
        isLoading: loadingSent,
        isLoadingMore: loadingMoreSent,
        hasMore: hasMoreSent,
        totalCount: sentCount,
        error: sentError,
        loadMore: loadMoreSent,
        removeRequestFromState: removeSent,
        fetchFirstPage: refetchSent,
    } = useSentRequests(20);

    const [retrying, setRetrying] = useState(false);

    const handleRetry = useCallback(async () => {
        setRetrying(true);
        if (activeTab === 'received') {
            await refetchPending();
        } else {
            await refetchSent();
        }
        setRetrying(false);
    }, [activeTab, refetchPending, refetchSent]);

    return (
        <div className="w-full pb-8 pt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Nút quay lại */}
            <button
                onClick={() => navigate('/friends')}
                className="flex items-center gap-2 text-[#8E8E93] hover:text-white mb-6 group transition-colors w-fit"
            >
                <div className="p-2 rounded-full bg-[#1C1C1E] border border-white/[0.07] group-hover:bg-[#4F6BFF]/10 transition-all">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Quay lại bạn bè</span>
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                        Lời mời kết bạn
                    </h1>
                    <p className="text-[#8E8E93] text-base max-w-lg">
                        Quản lý những người muốn kết nối với bạn hoặc theo dõi các lời mời bạn đã gửi đi.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center bg-[#252529] border border-white/[0.07] p-1.5 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'received'
                                ? 'bg-[#4F6BFF] text-white shadow-lg'
                                : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <UserPlus size={18} />
                        <span>Nhận được</span>
                        {pendingCount > 0 && (
                            <span
                                className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'received' ? 'bg-white/20' : 'bg-[#4F6BFF]/20 text-[#4F6BFF]'
                                    }`}
                            >
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'sent'
                                ? 'bg-[#4F6BFF] text-white shadow-lg'
                                : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Send size={18} />
                        <span>Đã gửi</span>
                        {sentCount > 0 && (
                            <span
                                className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'sent' ? 'bg-white/20' : 'bg-[#4F6BFF]/20 text-[#4F6BFF]'
                                    }`}
                            >
                                {sentCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Nội dung */}
            <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-[32px] p-2 md:p-6 shadow-sm">
                {/* Tab: Lời mời nhận được */}
                {activeTab === 'received' && (
                    <div className="space-y-4 min-h-[400px]">
                        {loadingPending && !pendingError && (
                            <div className="flex flex-col items-center justify-center py-20 text-[#8E8E93]">
                                <Loader2 size={40} className="animate-spin text-[#4F6BFF] mb-4" />
                                <p>Đang tải lời mời...</p>
                            </div>
                        )}

                        {pendingError && !loadingPending && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <AlertCircle size={48} className="text-red-400 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Không thể tải dữ liệu</h3>
                                <p className="text-[#8E8E93] text-sm max-w-xs mb-6">{pendingError}</p>
                                <button
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="px-5 py-2.5 bg-[#4F6BFF] hover:bg-[#5b75ff] text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                                >
                                    <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {!loadingPending && !pendingError && pendingRequests.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-white/[0.07] rounded-full flex items-center justify-center mb-4">
                                    <UserCheck size={32} className="text-[#8E8E93]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Không có lời mời mới</h3>
                                <p className="text-[#8E8E93] max-w-sm">
                                    Khi ai đó gửi lời mời kết bạn cho bạn, thông tin của họ sẽ xuất hiện tại đây.
                                </p>
                            </div>
                        )}

                        {!loadingPending && !pendingError && pendingRequests.length > 0 && (
                            <div className="animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pendingRequests.map((request) => (
                                        <FriendRequestItem
                                            key={request.friendshipId}
                                            request={request}
                                            onActionSuccess={removePending}
                                        />
                                    ))}
                                </div>
                                {hasMorePending && (
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={loadMorePending}
                                            disabled={loadingMorePending}
                                            className="px-6 py-2.5 bg-[#252529] hover:bg-[#2E2E33] border border-white/[0.07] rounded-full text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loadingMorePending ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Search size={16} />
                                            )}
                                            {loadingMorePending ? 'Đang tải...' : 'Xem thêm lời mời'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Đã gửi */}
                {activeTab === 'sent' && (
                    <div className="space-y-4 min-h-[400px]">
                        {loadingSent && !sentError && (
                            <div className="flex flex-col items-center justify-center py-20 text-[#8E8E93]">
                                <Loader2 size={40} className="animate-spin text-[#4F6BFF] mb-4" />
                                <p>Đang tải danh sách...</p>
                            </div>
                        )}

                        {sentError && !loadingSent && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <AlertCircle size={48} className="text-red-400 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Không thể tải dữ liệu</h3>
                                <p className="text-[#8E8E93] text-sm max-w-xs mb-6">{sentError}</p>
                                <button
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="px-5 py-2.5 bg-[#4F6BFF] hover:bg-[#5b75ff] text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                                >
                                    <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {!loadingSent && !sentError && sentRequests.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-white/[0.07] rounded-full flex items-center justify-center mb-4">
                                    <Send size={32} className="text-[#8E8E93]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Chưa gửi lời mời nào</h3>
                                <p className="text-[#8E8E93] max-w-sm">
                                    Bạn có thể tìm kiếm những người bạn biết hoặc xem qua danh sách gợi ý để kết nối.
                                </p>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => navigate('/friends')}
                                        className="px-5 py-2.5 bg-[#4F6BFF]/10 text-[#4F6BFF] hover:bg-[#4F6BFF]/20 rounded-xl font-medium transition-colors"
                                    >
                                        Gợi ý kết bạn
                                    </button>
                                    <button
                                        onClick={() => navigate('/search/users')}
                                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Tìm bạn bè
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loadingSent && !sentError && sentRequests.length > 0 && (
                            <div className="animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {sentRequests.map((request) => (
                                        <SentRequestItem
                                            key={request.friendshipId}
                                            request={request}
                                            onCancelSuccess={removeSent}
                                        />
                                    ))}
                                </div>
                                {hasMoreSent && (
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={loadMoreSent}
                                            disabled={loadingMoreSent}
                                            className="px-6 py-2.5 bg-[#252529] hover:bg-[#2E2E33] border border-white/[0.07] rounded-full text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loadingMoreSent ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Search size={16} />
                                            )}
                                            {loadingMoreSent ? 'Đang tải...' : 'Xem thêm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendRequestsPage;