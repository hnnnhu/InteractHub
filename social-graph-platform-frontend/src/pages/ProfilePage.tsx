// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Settings, Edit3, Loader2, Calendar, Grid3x3, Image as ImageIcon,
    Users, Lock, MessageCircle, UserX, ShieldAlert
} from 'lucide-react';
import useUserProfile from '../hooks/useUserProfile';
import UserAvatar from '../components/user/UserAvatar';
import FriendshipButton from '../components/user/FriendshipButton';
import CloseFriendButton from '../components/user/CloseFriendButton';
import BlockButton from '../components/block/BlockButton';
import AvatarUploader from '../components/user/AvatarUploader';
import CoverUploader from '../components/user/CoverUploader';
import PostDetailModal from '../components/feed/PostDetailModal';
import { postApi } from '../api/postApi';
import { friendshipApi } from '../api/friendshipApi';
import { useBlockStatus } from '../hooks/useBlockStatus';
import type { PostSummaryDto } from '../api/postApi';
import type { FriendshipResponseDto } from '../types/friendship';

const PROFILE_TABS = [
    { id: 'posts', label: 'Bài viết', icon: Grid3x3 },
    { id: 'photos', label: 'Hình ảnh', icon: ImageIcon },
    { id: 'friends', label: 'Bạn bè', icon: Users },
] as const;

type TabId = (typeof PROFILE_TABS)[number]['id'];

/** Card bài viết – click mở modal chi tiết */
const PostCard: React.FC<{ post: PostSummaryDto; onClick: () => void }> = ({ post, onClick }) => (
    <div
        onClick={onClick}
        className="group cursor-pointer bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex gap-4"
    >
        {post.firstMediaUrl ? (
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={post.firstMediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
        ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                <MessageCircle size={28} className="text-gray-600" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-white text-sm line-clamp-2 font-medium mb-2">{post.content || 'Bài viết không nội dung'}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>👍 {post.likeCount}</span>
                <span>💬 {post.commentCount}</span>
                <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
    </div>
);

/** Tab bài viết dạng danh sách */
const PostsTab: React.FC<{ userId: string; onPostClick: (id: string) => void }> = ({ userId, onPostClick }) => {
    const [posts, setPosts] = useState<PostSummaryDto[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let ignore = false;
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const res = await postApi.getUserPosts(userId, page, 12);
                if (ignore) return;
                if (res.isSuccess && res.data) {
                    setPosts(prev => (page === 1 ? res.data!.items : [...prev, ...res.data!.items]));
                    setHasMore(res.data.hasNextPage);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        fetchPosts();
        return () => { ignore = true; };
    }, [userId, page]);

    if (loading && posts.length === 0) {
        return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>;
    }
    if (!loading && posts.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <Grid3x3 size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-white font-bold text-lg">Chưa có bài viết nào</p>
                <p className="text-sm mt-1">Hãy là người đầu tiên chia sẻ!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map(post => <PostCard key={post.id} post={post} onClick={() => onPostClick(post.id)} />)}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button onClick={() => setPage(p => p + 1)} disabled={loading}
                        className="px-6 py-2.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

/** Tab hình ảnh dạng grid */
const PhotosTab: React.FC<{ userId: string; onPostClick: (id: string) => void }> = ({ userId, onPostClick }) => {
    const [photos, setPhotos] = useState<PostSummaryDto[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        const fetchPhotos = async () => {
            setLoading(true);
            try {
                const res = await postApi.getUserPosts(userId, page, 30);
                if (ignore) return;
                if (res.isSuccess && res.data) {
                    const withMedia = res.data.items.filter(p => p.firstMediaUrl);
                    setPhotos(prev => (page === 1 ? withMedia : [...prev, ...withMedia]));
                    setHasMore(res.data.hasNextPage);
                }
            } catch (err) { console.error(err); }
            finally { if (!ignore) setLoading(false); }
        };
        fetchPhotos();
        return () => { ignore = true; };
    }, [userId, page]);

    if (loading && photos.length === 0) {
        return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>;
    }
    if (!loading && photos.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <ImageIcon size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-white font-bold text-lg">Chưa có ảnh nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {photos.map(post => (
                    <div key={post.id} onClick={() => onPostClick(post.id)}
                        className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition cursor-pointer group">
                        <img src={post.firstMediaUrl!} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                ))}
            </div>
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button onClick={() => setPage(p => p + 1)} disabled={loading}
                        className="px-6 py-2.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

/** Tab bạn bè */
const FriendsTab: React.FC<{ userId: string }> = ({ userId }) => {
    const [friends, setFriends] = useState<FriendshipResponseDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await friendshipApi.getFriends(userId, 1, 50);
                if (ignore) return;
                if (res.isSuccess && res.data?.items) setFriends(res.data.items);
            } catch (err) { console.error(err); }
            finally { if (!ignore) setLoading(false); }
        };
        fetch();
        return () => { ignore = true; };
    }, [userId]);

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>;
    if (!loading && friends.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-white font-bold text-lg">Chưa có bạn bè</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map(f => {
                const friend = f.requesterId === userId
                    ? { id: f.addresseeId, userName: f.addresseeUserName, fullName: f.addresseeFullName, avatarUrl: f.addresseeAvatarUrl }
                    : { id: f.requesterId, userName: f.requesterUserName, fullName: f.requesterFullName, avatarUrl: f.requesterAvatarUrl };
                return (
                    <Link to={`/profile/${friend.userName}`} key={f.id}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/5 group">
                        <UserAvatar userName={friend.userName} fullName={friend.fullName} avatarUrl={friend.avatarUrl} size="sm" disableLink />
                        <div className="flex flex-col min-w-0">
                            <span className="text-white font-semibold truncate">{friend.fullName}</span>
                            <span className="text-gray-400 text-xs truncate">@{friend.userName}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

// ============================================================
//  MAIN PROFILE PAGE
// ============================================================
const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('posts');
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    const { profile, isLoading, error, refetch } = useUserProfile(
        username || 'me',
        username ? 'username' : 'me'
    );

    const targetUserId = profile?.id || '';
    const isMe = !username || username === 'me' || username === localStorage.getItem('userName');
    const { isBlockedByMe, hasBlockedMe, isLoading: blockStatusLoading } = useBlockStatus(isMe ? '' : targetUserId);

    const currentUser = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }, []);

    const actuallyMe = isMe || (currentUser?.userName === profile?.userName);

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0D15] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-indigo-400" />
                    <p className="text-gray-400 font-medium animate-pulse">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    // Error / not found
    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#0F0D15] flex flex-col items-center justify-center gap-4 px-4">
                <div className="w-24 h-24 bg-red-500/10 text-red-400 flex items-center justify-center rounded-full shadow-lg">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-white font-bold text-2xl">Không tìm thấy người dùng</h2>
                <p className="text-gray-400 text-sm text-center max-w-md">{error || 'Hồ sơ này không tồn tại hoặc đã bị ẩn.'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition">
                    Quay lại
                </button>
            </div>
        );
    }

    // Private profile
    if (profile.isPrivateProfileView && !actuallyMe) {
        return (
            <div className="min-h-screen bg-[#0F0D15] flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Lock size={36} className="text-amber-400" />
                    </div>
                    <h1 className="text-white font-extrabold text-2xl mb-2">Hồ sơ riêng tư</h1>
                    <p className="text-gray-400 text-sm mb-6">Người dùng này đã đặt hồ sơ ở chế độ riêng tư.</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Handlers
    const handlePostClick = (postId: string) => setSelectedPostId(postId);

    return (
        <Fragment>
            <div className="w-full min-h-screen bg-[#0F0D15] pb-20 animate-in fade-in duration-500">
                {/* COVER */}
                <div className="relative w-full h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 overflow-hidden">
                    {profile.coverPhotoUrl ? (
                        <img src={profile.coverPhotoUrl} alt="Ảnh bìa" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-repeat opacity-30" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
                        }} />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0F0D15] to-transparent" />
                    {actuallyMe && (
                        <div className="absolute bottom-3 right-3 z-20">
                            <CoverUploader onUploadSuccess={() => refetch()} />
                        </div>
                    )}
                </div>

                {/* AVATAR & NAME */}
                <div className="relative z-20 px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                            <div className="relative">
                                {actuallyMe ? (
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-[#0F0D15] rounded-full shadow-xl overflow-hidden">
                                        <AvatarUploader
                                            currentAvatarUrl={profile.avatarUrl ?? ''}
                                            fullName={profile.fullName}
                                            onUploadSuccess={() => refetch()}
                                        />
                                    </div>
                                ) : (
                                    <UserAvatar
                                        userName={profile.userName}
                                        fullName={profile.fullName}
                                        avatarUrl={profile.avatarUrl}
                                        size="xl"
                                        disableLink
                                        className="!w-28 !h-28 sm:!w-32 sm:!h-32 ring-4 ring-[#0F0D15] rounded-full shadow-xl"
                                    />
                                )}
                            </div>
                            <div className="text-center sm:text-left pb-1">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                    {profile.fullName}
                                </h1>
                                <p className="text-gray-400 font-medium text-[15px]">@{profile.userName}</p>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center justify-center sm:justify-start gap-3 pb-2 sm:pb-4 w-full sm:w-auto">
                            {actuallyMe ? (
                                <>
                                    <Link to="/settings/profile" className="flex-1 sm:flex-none inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-colors border border-white/10 hover:border-white/30">
                                        <Edit3 size={18} /> Chỉnh sửa hồ sơ
                                    </Link>
                                    <Link to="/settings/security" className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10">
                                        <Settings size={20} />
                                    </Link>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <FriendshipButton
                                        targetUserId={profile.id}
                                        isFriend={profile.isFriend}
                                        status={profile.friendshipStatus ?? null}
                                        friendshipId={null}
                                        onAction={refetch}
                                    />
                                    {profile.isFriend && (
                                        <CloseFriendButton
                                            targetUserId={profile.id}
                                            isCloseFriend={profile.isCloseFriend ?? false}
                                            onSuccess={refetch}
                                        />
                                    )}
                                    <BlockButton targetUserId={profile.id} onSuccess={refetch} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STATS ROW */}
                    <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-2 mb-6">
                        <div className="text-center"><span className="text-xl font-bold text-white">{profile.postCount}</span><span className="text-xs text-gray-400 ml-1">bài viết</span></div>
                        <div className="text-center"><span className="text-xl font-bold text-white">{profile.friendCount}</span><span className="text-xs text-gray-400 ml-1">bạn bè</span></div>
                        <div className="text-center"><span className="text-xl font-bold text-white">{profile.storyCount || 0}</span><span className="text-xs text-gray-400 ml-1">tin</span></div>
                        <div className="text-center"><span className="text-xl font-bold text-white">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' }) : '—'}</span><span className="text-xs text-gray-400 ml-1">sinh nhật</span></div>
                    </div>

                    {/* Block warning */}
                    {!actuallyMe && !blockStatusLoading && (isBlockedByMe || hasBlockedMe) && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                            <UserX size={20} className="text-red-400" />
                            <span className="text-red-300 text-sm font-medium">
                                {isBlockedByMe ? 'Bạn đã chặn người dùng này.' : 'Bạn đã bị người dùng này chặn.'}
                            </span>
                        </div>
                    )}

                    {/* 2-COLUMN LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                        {/* LEFT COLUMN */}
                        <div className="col-span-1 space-y-6">
                            {/* About Card */}
                            <div className="bg-[#1A1825]/80 border border-white/5 rounded-2xl p-5 space-y-4">
                                <h3 className="text-white font-bold text-lg">Giới thiệu</h3>
                                {profile.bio ? (
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Chưa có tiểu sử.</p>
                                )}
                                <div className="space-y-3 text-sm text-gray-400">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={18} className="text-gray-500 shrink-0" />
                                        <span>Tham gia {new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    {profile.dateOfBirth && (
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-gray-500 shrink-0" />
                                            <span>Sinh nhật: {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {profile.isPrivateProfileView && (
                                        <div className="flex items-center gap-3 text-amber-400">
                                            <Lock size={18} />
                                            <span>Hồ sơ riêng tư</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Photos Preview */}
                            <PhotosPreview userId={profile.id} onPostClick={handlePostClick} />
                            {/* Friends Preview */}
                            <FriendsPreview userId={profile.id} />
                        </div>

                        {/* RIGHT COLUMN – Tabs */}
                        <div className="col-span-1 lg:col-span-2">
                            {!profile.isPrivateProfileView ? (
                                <>
                                    <div className="flex items-center border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide">
                                        {PROFILE_TABS.map(tab => {
                                            const active = activeTab === tab.id;
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex items-center gap-2 px-6 py-4 font-semibold text-[15px] transition-all relative whitespace-nowrap ${active ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <Icon size={18} className={active ? 'text-indigo-400' : ''} />
                                                    {tab.label}
                                                    {active && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-[#1A1825]/50 border border-white/5 rounded-2xl p-4 sm:p-6 min-h-[400px]">
                                        {activeTab === 'posts' && <PostsTab key={profile.id} userId={profile.id} onPostClick={handlePostClick} />}
                                        {activeTab === 'photos' && <PhotosTab key={profile.id} userId={profile.id} onPostClick={handlePostClick} />}
                                        {activeTab === 'friends' && <FriendsTab key={profile.id} userId={profile.id} />}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Lock size={24} className="mr-2" /> Nội dung bị ẩn
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL XEM CHI TIẾT BÀI VIẾT – đặt cùng cấp với div wrapper nhờ Fragment */}
            {selectedPostId && (
                <PostDetailModal
                    isOpen={!!selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    postId={selectedPostId}
                />
            )}
        </Fragment>
    );
};

// ============================================================
//  HELPER COMPONENTS (PhotosPreview, FriendsPreview)
// ============================================================
const PhotosPreview: React.FC<{ userId: string; onPostClick: (id: string) => void }> = ({ userId, onPostClick }) => {
    const [photos, setPhotos] = useState<PostSummaryDto[]>([]);
    useEffect(() => {
        let ignore = false;
        postApi.getUserPosts(userId, 1, 12).then(res => {
            if (ignore || !res.isSuccess || !res.data) return;
            setPhotos(res.data.items.filter(p => p.firstMediaUrl).slice(0, 6));
        }).catch(console.error);
        return () => { ignore = true; };
    }, [userId]);

    if (photos.length === 0) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-white text-sm font-semibold">Ảnh</h4>
                <span className="text-xs text-gray-400 cursor-pointer hover:text-indigo-400">Xem tất cả</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {photos.map(photo => (
                    <div key={photo.id} onClick={() => onPostClick(photo.id)}
                        className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400/50 transition cursor-pointer">
                        <img src={photo.firstMediaUrl!} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const FriendsPreview: React.FC<{ userId: string }> = ({ userId }) => {
    const [friends, setFriends] = useState<{ id: string; userName: string; fullName: string; avatarUrl?: string; }[]>([]);
    useEffect(() => {
        let ignore = false;
        friendshipApi.getFriends(userId, 1, 6).then(res => {
            if (ignore || !res.isSuccess || !res.data?.items) return;
            const list = res.data.items.slice(0, 6).map(f => {
                const friend = f.requesterId === userId
                    ? { id: f.addresseeId, userName: f.addresseeUserName, fullName: f.addresseeFullName, avatarUrl: f.addresseeAvatarUrl }
                    : { id: f.requesterId, userName: f.requesterUserName, fullName: f.requesterFullName, avatarUrl: f.requesterAvatarUrl };
                return friend;
            });
            setFriends(list);
        }).catch(console.error);
        return () => { ignore = true; };
    }, [userId]);

    if (friends.length === 0) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-white text-sm font-semibold">Bạn bè</h4>
                <Link to={`/profile/${userId}?tab=friends`} className="text-xs text-gray-400 hover:text-indigo-400">Xem tất cả</Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {friends.map(f => (
                    <Link to={`/profile/${f.userName}`} key={f.id} className="flex flex-col items-center gap-1 group">
                        <div className="w-12 h-12 rounded-full ring-1 ring-white/10 overflow-hidden group-hover:ring-indigo-400 transition">
                            <UserAvatar userName={f.userName} fullName={f.fullName} avatarUrl={f.avatarUrl} size="sm" disableLink className="!w-full !h-full" />
                        </div>
                        <span className="text-xs text-gray-400 truncate w-14 text-center group-hover:text-white">{f.fullName.split(' ')[0]}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ProfilePage;