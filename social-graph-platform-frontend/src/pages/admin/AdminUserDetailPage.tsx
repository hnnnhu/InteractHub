import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import type { AdminUserDetail } from '../../types/admin';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_API_URL || 'https://localhost:7042/api';
    const root = base.replace(/\/api\/?$/, '');
    return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

// ─────────────────────────────────────────────
// Icons (inline SVG, consistent with dark theme)
// ─────────────────────────────────────────────
const BackIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M15 19l-7-7 7-7" />
    </svg>
);

const BanIcon = () => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const UnlockIcon = () => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

const XIcon = () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UserIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const MailIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const UsersIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const FileTextIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// ─────────────────────────────────────────────
// Avatar with dark fallback
// ─────────────────────────────────────────────
const AVATAR_DARK_COLORS = [
    'bg-violet-500/20 text-violet-300',
    'bg-sky-500/20 text-sky-300',
    'bg-rose-500/20 text-rose-300',
    'bg-teal-500/20 text-teal-300',
    'bg-amber-500/20 text-amber-300',
];

interface AvatarProps {
    src?: string | null;
    name: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name }) => {
    const [err, setErr] = useState(false);
    const resolved = resolveUrl(src);
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const color = AVATAR_DARK_COLORS[(name.charCodeAt(0) || 0) % AVATAR_DARK_COLORS.length];

    if (!resolved || err) {
        return (
            <span className={`w-24 h-24 rounded-2xl inline-flex items-center justify-center text-3xl font-bold flex-shrink-0 ${color}`}>
                {initials}
            </span>
        );
    }

    return (
        <img
            src={resolved}
            alt={name}
            onError={() => setErr(true)}
            className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 ring-2 ring-white/10"
        />
    );
};

// ─────────────────────────────────────────────
// Modal overlay (dark)
// ─────────────────────────────────────────────
interface ModalOverlayProps {
    children: React.ReactNode;
    onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md">{children}</div>
    </div>
);

// ─────────────────────────────────────────────
// Feedback state
// ─────────────────────────────────────────────
interface FeedbackState {
    type: 'success' | 'error';
    message: string;
}

// ─────────────────────────────────────────────
// AdminUserDetailPage (dark theme)
// ─────────────────────────────────────────────
const AdminUserDetailPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!userId) return;
        const fetchUser = async (): Promise<void> => {
            setLoading(true);
            setError(null);
            try {
                const res = await adminApi.getUserDetail(userId);
                if (!mountedRef.current) return;
                if (res.isSuccess && res.data) {
                    setUser(res.data);
                } else {
                    setError(res.message || 'Không thể tải thông tin.');
                }
            } catch (err: unknown) {
                if (!mountedRef.current) return;
                setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    // ── Ban / Unban ──
    const [isBanning, setIsBanning] = useState(false);
    const [showBanConfirm, setShowBanConfirm] = useState(false);

    const executeBan = async (): Promise<void> => {
        if (!userId || !user) return;
        setIsBanning(true);
        try {
            const res = user.isBanned
                ? await adminApi.unbanUser(userId)
                : await adminApi.banUser(userId);
            if (res.isSuccess) {
                setUser((prev) => (prev ? { ...prev, isBanned: !prev.isBanned } : prev));
                setShowBanConfirm(false);
            } else {
                alert(res.message || 'Thao tác thất bại');
            }
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Lỗi thực hiện');
        } finally {
            setIsBanning(false);
        }
    };

    // ── Role management ──
    const [newRole, setNewRole] = useState('');
    const [roleFeedback, setRoleFeedback] = useState<FeedbackState | null>(null);
    const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);

    const handleAddRole = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!userId || !newRole.trim()) return;
        setIsRoleSubmitting(true);
        setRoleFeedback(null);
        try {
            const trimmed = newRole.trim();
            const res = await adminApi.addRole(userId, trimmed);
            if (res.isSuccess) {
                setRoleFeedback({ type: 'success', message: `Đã thêm vai trò "${trimmed}"` });
                setNewRole('');
                setUser((prev) =>
                    prev ? { ...prev, roles: [...prev.roles.filter((r) => r !== trimmed), trimmed] } : prev
                );
            } else {
                setRoleFeedback({ type: 'error', message: res.message || 'Không thể thêm vai trò.' });
            }
        } catch (err: unknown) {
            setRoleFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi hệ thống' });
        } finally {
            setIsRoleSubmitting(false);
        }
    };

    const handleRemoveRole = async (roleName: string): Promise<void> => {
        if (!userId || !user) return;
        if (roleName === 'Admin' && user.id === userId) {
            alert('Bạn không thể tự xóa quyền Admin của chính mình.');
            return;
        }
        try {
            const res = await adminApi.removeRole(userId, roleName);
            if (res.isSuccess) {
                setUser((prev) => prev ? { ...prev, roles: prev.roles.filter((r) => r !== roleName) } : prev);
                setRoleFeedback({ type: 'success', message: `Đã xóa vai trò "${roleName}"` });
            } else {
                setRoleFeedback({ type: 'error', message: res.message || 'Không thể xóa vai trò.' });
            }
        } catch (err: unknown) {
            setRoleFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi hệ thống' });
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                    </div>
                    <p className="text-sm text-slate-400">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    // ── Error state ──
    if (error || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="bg-rose-900/30 border border-rose-700 text-rose-300 px-6 py-4 rounded-xl mb-4 max-w-md text-center text-sm">
                    {error || 'Không tìm thấy người dùng.'}
                </div>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition"
                >
                    <BackIcon /> Quay lại danh sách
                </button>
            </div>
        );
    }

    // ── Main render (dark theme) ──
    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-8">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 text-sm font-medium transition"
                    >
                        <BackIcon />
                        Quản lý người dùng
                    </button>
                    <span className="text-slate-600 text-sm">/</span>
                    <span className="text-sm text-slate-300 font-medium">{user.fullName}</span>
                </div>

                {/* ── Profile hero card ── */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow overflow-hidden mb-5">
                    {/* Gradient cover strip */}
                    <div className="h-24 bg-gradient-to-r from-indigo-900/40 via-violet-900/40 to-sky-900/40" />

                    <div className="px-6 pb-6">
                        {/* Avatar + badges row */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
                            <div className="flex items-end gap-4">
                                <Avatar src={user.avatarUrl} name={user.fullName} />
                                <div className="pb-1">
                                    <h1 className="text-xl font-bold text-white leading-tight">{user.fullName}</h1>
                                    <p className="text-sm text-slate-400">@{user.userName}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pb-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${user.isDeleted
                                        ? 'bg-rose-900/30 border-rose-700 text-rose-300'
                                        : 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isDeleted ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                    {user.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                                </span>

                                {user.isBanned && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-rose-900/30 border-rose-700 text-rose-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                        Bị khóa
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        {user.bio && (
                            <p className="text-sm text-slate-400 italic border-l-2 border-indigo-500 pl-3 mb-5">
                                {user.bio}
                            </p>
                        )}

                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                            <div className="flex items-center gap-2.5 text-sm text-slate-300">
                                <span className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                    <MailIcon />
                                </span>
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-slate-300">
                                <span className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                    <CalendarIcon />
                                </span>
                                Tham gia {formatDate(user.createdAt)}
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    icon: <UsersIcon />,
                                    label: 'Người theo dõi',
                                    val: (user.followerCount ?? 0).toLocaleString(),
                                    color: 'text-indigo-400',
                                },
                                {
                                    icon: <FileTextIcon />,
                                    label: 'Bài viết',
                                    val: (user.postCount ?? 0).toLocaleString(),
                                    color: 'text-violet-400',
                                },
                                {
                                    icon: <UserIcon />,
                                    label: 'Quyền riêng tư',
                                    val: user.profileVisibility ?? '—',
                                    color: 'text-sky-400',
                                },
                                {
                                    icon: <ShieldIcon />,
                                    label: 'Vai trò',
                                    val: user.roles.length > 0 ? user.roles[0] : 'Người dùng',
                                    color: 'text-teal-400',
                                },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-slate-900 rounded-xl px-4 py-3">
                                    <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>
                                        {stat.icon}
                                        <span className="text-xs text-slate-500">{stat.label}</span>
                                    </div>
                                    <p className="font-bold text-white text-base">{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Two‑column actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Account actions */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow p-6">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <ShieldIcon />
                            </span>
                            Thao tác tài khoản
                        </h3>

                        <div className="flex items-start justify-between p-4 rounded-xl bg-slate-900 border border-slate-700">
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {user.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {user.isBanned
                                        ? 'Khôi phục quyền truy cập cho người dùng này'
                                        : 'Ngăn người dùng đăng nhập vào hệ thống'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBanConfirm(true)}
                                disabled={isBanning}
                                className={`ml-4 flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${user.isBanned
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30'
                                    }`}
                            >
                                {user.isBanned ? (
                                    <><UnlockIcon /> Mở khóa</>
                                ) : (
                                    <><BanIcon /> Khóa</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Role management */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow p-6">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-900/50 flex items-center justify-center text-indigo-400">
                                <ShieldIcon />
                            </span>
                            Quản lý vai trò
                        </h3>

                        {roleFeedback && (
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm border ${roleFeedback.type === 'success'
                                    ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                                    : 'bg-rose-900/30 border-rose-700 text-rose-300'
                                }`}>
                                <span>{roleFeedback.type === 'success' ? '✓' : '✕'}</span>
                                {roleFeedback.message}
                            </div>
                        )}

                        {/* Current roles */}
                        <div className="mb-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Vai trò hiện tại</p>
                            {user.roles.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <span key={role} className="inline-flex items-center gap-1.5 bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-3 py-1 rounded-full text-xs font-semibold">
                                            {role}
                                            <button
                                                onClick={() => handleRemoveRole(role)}
                                                className="w-4 h-4 rounded-full bg-indigo-800 hover:bg-red-600 text-indigo-300 hover:text-white flex items-center justify-center transition"
                                                title="Xóa vai trò"
                                            >
                                                <XIcon />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">Chưa có vai trò nào</p>
                            )}
                        </div>

                        {/* Add role form */}
                        <form onSubmit={handleAddRole} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Tên vai trò (Admin, Moderator...)"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="flex-1 text-sm border border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition"
                            />
                            <button
                                type="submit"
                                disabled={isRoleSubmitting || !newRole.trim()}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <PlusIcon />
                                {isRoleSubmitting ? 'Đang thêm...' : 'Thêm'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Ban / Unban confirmation modal ── */}
            {showBanConfirm && (
                <ModalOverlay onClose={() => setShowBanConfirm(false)}>
                    <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${user.isBanned ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'
                                }`}>
                                {user.isBanned ? <UnlockIcon /> : <BanIcon />}
                            </span>
                            <div>
                                <h2 className="text-base font-bold text-white">
                                    {user.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                </h2>
                                <p className="text-xs text-slate-400">{user.fullName}</p>
                            </div>
                            <button
                                onClick={() => setShowBanConfirm(false)}
                                className="ml-auto text-slate-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm text-slate-300">
                                {user.isBanned
                                    ? 'Người dùng sẽ có thể đăng nhập và sử dụng nền tảng bình thường.'
                                    : 'Người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào.'}
                            </p>
                        </div>

                        <div className="px-6 pb-5 flex justify-end gap-2.5">
                            <button onClick={() => setShowBanConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-300 border border-slate-600 rounded-xl hover:bg-slate-700 transition">
                                Hủy
                            </button>
                            <button
                                onClick={executeBan}
                                disabled={isBanning}
                                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed ${user.isBanned
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30'
                                        : 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30'
                                    }`}
                            >
                                {isBanning ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
};

export default AdminUserDetailPage;