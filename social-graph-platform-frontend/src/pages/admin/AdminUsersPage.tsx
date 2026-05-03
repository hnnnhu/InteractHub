import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import type { AdminUserSummary } from '../../types/admin';

/* ------------------------------------------------------------------ */
/*  TYPES                                                            */
/* ------------------------------------------------------------------ */
interface AdminUserTableItem {
    id: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
    followerCount?: number;
    postCount?: number;
    status?: string;
    joinedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  ICONS (SVG inline)                                               */
/* ------------------------------------------------------------------ */
const SearchIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

const EyeIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const WarnIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
    </svg>
);

const BanIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m5 0H5" />
    </svg>
);

const DotsIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UsersIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5l7 7-7 7" />
    </svg>
);

/* ------------------------------------------------------------------ */
/*  STATUS BADGE (pink/rose accents)                                 */
/* ------------------------------------------------------------------ */
interface StatusConfig {
    bg: string;
    dot: string;
    text: string;
    label: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
    Active: {
        bg: 'bg-emerald-900/30 border-emerald-700',
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
        label: 'Hoạt động',
    },
    Banned: {
        bg: 'bg-rose-900/30 border-rose-700',
        dot: 'bg-rose-400',
        text: 'text-rose-300',
        label: 'Bị khóa',
    },
    Unverified: {
        bg: 'bg-amber-900/30 border-amber-700',
        dot: 'bg-amber-400',
        text: 'text-amber-300',
        label: 'Chưa xác nhận',
    },
};

const DEFAULT_STATUS: StatusConfig = {
    bg: 'bg-slate-700 border-slate-600',
    dot: 'bg-slate-400',
    text: 'text-slate-400',
    label: '—',
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    const cfg = (status && STATUS_MAP[status]) || DEFAULT_STATUS;
    const label = (status && STATUS_MAP[status]?.label) || status || '—';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {label}
        </span>
    );
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                          */
/* ------------------------------------------------------------------ */
const normalizeUserItem = (item: AdminUserSummary): AdminUserTableItem => ({
    id: item.id ?? '',
    userName: item.userName ?? '',
    fullName: item.fullName ?? '',
    avatarUrl: item.avatarUrl ?? null,
    email: item.email ?? undefined,
    followerCount: item.followerCount ?? undefined,
    postCount: item.postCount ?? undefined,
    status: item.status ?? undefined,
    joinedAt: item.createdAt ?? undefined,
});

const resolveAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_API_URL || 'https://localhost:7042/api';
    const root = base.replace(/\/api\/?$/, '');
    return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

/* ------------------------------------------------------------------ */
/*  AVATAR (with dark background fallback)                           */
/* ------------------------------------------------------------------ */
const AVATAR_COLORS = [
    'bg-pink-500/20 text-pink-300',
    'bg-rose-500/20 text-rose-300',
    'bg-fuchsia-500/20 text-fuchsia-300',
    'bg-purple-500/20 text-purple-300',
    'bg-amber-500/20 text-amber-300',
];

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: 'sm' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'sm' }) => {
    const [err, setErr] = useState(false);
    const resolved = resolveAvatarUrl(src);
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const dim = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs';
    const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

    if (!resolved || err) {
        return (
            <span className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${dim} ${color}`}>
                {initials}
            </span>
        );
    }

    return (
        <img
            src={resolved}
            alt={name}
            onError={() => setErr(true)}
            className={`rounded-full object-cover flex-shrink-0 ring-2 ring-white/10 ${dim}`}
        />
    );
};

/* ------------------------------------------------------------------ */
/*  MODAL OVERLAY                                                    */
/* ------------------------------------------------------------------ */
interface ModalOverlayProps {
    children: React.ReactNode;
    onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md">{children}</div>
    </div>
);

type ModalType = 'warn' | 'ban' | 'delete';

interface ModalState {
    type: ModalType;
    user: AdminUserTableItem;
}

/* ------------------------------------------------------------------ */
/*  ADMIN USERS PAGE (PINK / BLACK THEME)                            */
/* ------------------------------------------------------------------ */
const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUserTableItem[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [modal, setModal] = useState<ModalState | null>(null);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [banReason, setBanReason] = useState('Spam');
    const [banNote, setBanNote] = useState('');
    const [warnMessage, setWarnMessage] = useState('');
    const [drawerUser, setDrawerUser] = useState<AdminUserTableItem | null>(null);

    const fetchUsers = useCallback(
        async (keyword: string, pageNum: number, size: number): Promise<void> => {
            setLoading(true);
            setError(null);
            try {
                const res = await adminApi.getUsers({ keyword, pageNumber: pageNum, pageSize: size });
                if (res.isSuccess && res.data) {
                    setUsers((res.data.items || []).map(normalizeUserItem));
                    setTotalUsers(res.data.totalCount ?? 0);
                } else {
                    setError(res.message || 'Không thể tải danh sách người dùng.');
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        let cancelled = false;
        const load = async (): Promise<void> => {
            try {
                const res = await adminApi.getUsers({ keyword: '', pageNumber: 1, pageSize });
                if (cancelled) return;
                if (res.isSuccess && res.data) {
                    setUsers((res.data.items || []).map(normalizeUserItem));
                    setTotalUsers(res.data.totalCount ?? 0);
                } else {
                    setError(res.message || 'Không thể tải danh sách.');
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [pageSize]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent): void => {
        e.preventDefault();
        const term = searchInput.trim();
        setSearchTerm(term);
        setPage(1);
        setSelectedIds(new Set());
        fetchUsers(term, 1, pageSize);
    };

    const handlePageChange = (p: number): void => {
        setPage(p);
        setSelectedIds(new Set());
        fetchUsers(searchTerm, p, pageSize);
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const n = Number(e.target.value);
        setPageSize(n);
        setPage(1);
        setSelectedIds(new Set());
    };

    const toggleSelectAll = (): void => {
        setSelectedIds((prev) =>
            prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))
        );
    };

    const toggleSelectUser = (id: string): void => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openWarnModal = (user: AdminUserTableItem): void => {
        setWarnMessage('');
        setModal({ type: 'warn', user });
        setOpenDropdownId(null);
    };

    const openBanModal = (user: AdminUserTableItem): void => {
        setBanReason('Spam');
        setBanNote('');
        setModal({ type: 'ban', user });
        setOpenDropdownId(null);
    };

    const openDeleteModal = (user: AdminUserTableItem): void => {
        setConfirmDeleteText('');
        setModal({ type: 'delete', user });
        setOpenDropdownId(null);
    };

    const openDrawer = (user: AdminUserTableItem): void => {
        setDrawerUser(user);
        setOpenDropdownId(null);
    };

    const executeWarn = (): void => {
        if (!modal?.user) return;
        alert(`Đã gửi cảnh cáo đến ${modal.user.fullName}`);
        setModal(null);
    };

    const executeBan = (): void => {
        if (!modal?.user) return;
        alert(`Đã khóa tài khoản ${modal.user.fullName}`);
        setModal(null);
        fetchUsers(searchTerm, page, pageSize);
    };

    const executeDelete = (): void => {
        if (!modal?.user) return;
        if (confirmDeleteText !== 'XÁC NHẬN') {
            alert('Vui lòng nhập đúng "XÁC NHẬN"');
            return;
        }
        alert(`Đã xóa vĩnh viễn ${modal.user.fullName}`);
        setModal(null);
        fetchUsers(searchTerm, page, pageSize);
    };

    const totalPages = Math.ceil(totalUsers / pageSize) || 1;
    const showingFrom = totalUsers === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(page * pageSize, totalUsers);

    const renderPageButtons = (): React.ReactNode[] => {
        const pages: Array<number | '...'> = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages.map((p, idx) => {
            if (p === '...') {
                return (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm">
                        …
                    </span>
                );
            }
            const isActive = p === page;
            return (
                <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    {p}
                </button>
            );
        });
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ── Header ── */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-pink-400 uppercase mb-1">
                            Quản trị hệ thống
                        </p>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/30">
                                <UsersIcon />
                            </span>
                            Quản lý người dùng
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Quản lý tài khoản, trạng thái và quyền của người dùng
                        </p>
                    </div>
                    {totalUsers > 0 && (
                        <div className="hidden sm:flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 shadow">
                            <span className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 leading-tight">
                                tổng số<br />người dùng
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Search ── */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-4 mb-5">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 pointer-events-none">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, username hoặc email..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-700 rounded-xl bg-black placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-sm font-semibold rounded-xl shadow-sm shadow-pink-600/30 transition-all"
                        >
                            <SearchIcon />
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* ── Bulk actions ── */}
                {selectedIds.size > 0 && (
                    <div className="mb-4 flex items-center justify-between bg-pink-950/50 border border-pink-800/50 rounded-xl px-4 py-3">
                        <span className="text-sm font-medium text-pink-300">
                            Đã chọn <strong>{selectedIds.size}</strong> người dùng
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-3 py-1.5 text-xs text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
                            >
                                Bỏ chọn
                            </button>
                            <button
                                onClick={() => alert(`Khóa ${selectedIds.size} người dùng`)}
                                className="px-3 py-1.5 text-xs text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition flex items-center gap-1"
                            >
                                <BanIcon /> Khóa hàng loạt
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Loading / Error ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin" />
                        </div>
                        <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-start gap-3 bg-rose-900/30 border border-rose-800 text-rose-300 px-5 py-4 rounded-xl mb-5 text-sm">
                        <span className="text-rose-400 mt-0.5">⚠</span>
                        <div>
                            <p className="font-semibold mb-0.5">Đã xảy ra lỗi</p>
                            <p className="text-rose-400/80">{error}</p>
                        </div>
                    </div>
                )}

                {/* ── Users table ── */}
                {!loading && !error && users.length > 0 && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                {searchTerm ? `Kết quả cho "${searchTerm}"` : 'Tất cả người dùng'}
                            </span>
                            <span className="ml-auto text-xs text-gray-500">
                                {showingFrom}–{showingTo} / {totalUsers.toLocaleString()}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-black/70 border-b border-gray-800">
                                        <th className="pl-5 pr-3 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === users.length && users.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-600 text-pink-600 focus:ring-pink-500 focus:ring-offset-0 bg-gray-800"
                                            />
                                        </th>
                                        {['Người dùng', 'Email', 'Ngày tham gia', 'Trạng thái', ''].map((h, i) => (
                                            <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-850 transition-colors group">
                                            <td className="pl-5 pr-3 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="w-4 h-4 rounded border-gray-600 text-pink-600 focus:ring-pink-500 focus:ring-offset-0 bg-gray-800"
                                                />
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <button onClick={() => openDrawer(user)} className="flex items-center gap-3 text-left">
                                                    <Avatar src={user.avatarUrl} name={user.fullName} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-200 group-hover:text-pink-400 transition-colors leading-tight">
                                                            {user.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">@{user.userName}</p>
                                                    </div>
                                                </button>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-300">{user.email || '—'}</span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-300 tabular-nums">{formatDate(user.joinedAt)}</span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <StatusBadge status={user.status} />
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    {/* Nút xem trực tiếp */}
                                                    <Link
                                                        to={`/admin/users/${user.id}`}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-pink-400 hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title="Xem chi tiết"
                                                    >
                                                        <EyeIcon />
                                                    </Link>

                                                    {/* Menu hành động (ba chấm) */}
                                                    <div ref={dropdownRef} className="relative">
                                                        <button
                                                            onClick={() => setOpenDropdownId((prev) => (prev === user.id ? null : user.id))}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                                                        >
                                                            <DotsIcon />
                                                        </button>

                                                        {openDropdownId === user.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
                                                                <button
                                                                    onClick={() => openWarnModal(user)}
                                                                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-amber-400 hover:bg-gray-800 transition-colors"
                                                                >
                                                                    <span className="text-amber-500"><WarnIcon /></span> Cảnh cáo
                                                                </button>
                                                                <div className="border-t border-gray-700 my-1" />
                                                                <button
                                                                    onClick={() => openBanModal(user)}
                                                                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-rose-400 hover:bg-rose-600/20 transition-colors"
                                                                >
                                                                    <BanIcon /> Khóa tài khoản
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteModal(user)}
                                                                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-rose-500 hover:bg-rose-600/20 transition-colors"
                                                                >
                                                                    <TrashIcon /> Xóa vĩnh viễn
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ── */}
                        <div className="px-5 py-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/70">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Hiển thị</span>
                                <select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    className="border border-gray-600 rounded-lg px-2 py-1 text-sm bg-black text-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-pink-400 outline-none"
                                >
                                    {[10, 20, 50].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <span>hàng · {showingFrom}–{showingTo} trong tổng {totalUsers.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(1)} disabled={page === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
                                >«</button>
                                <button
                                    onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                ><ChevronLeftIcon /></button>
                                {renderPageButtons()}
                                <button
                                    onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                ><ChevronRightIcon /></button>
                                <button
                                    onClick={() => handlePageChange(totalPages)} disabled={page >= totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
                                >»</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && users.length === 0 && (
                    <div className="text-center py-24 bg-gray-900 rounded-2xl border border-gray-800 shadow">
                        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <UsersIcon />
                        </div>
                        <h3 className="text-base font-semibold text-gray-300 mb-1">Không tìm thấy người dùng</h3>
                        <p className="text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
                    </div>
                )}

                {/* ── WARN MODAL ── */}
                {modal?.type === 'warn' && (
                    <ModalOverlay onClose={() => setModal(null)}>
                        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
                                <span className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400">
                                    <WarnIcon />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-white">Gửi cảnh cáo</h2>
                                    <p className="text-xs text-gray-400">đến {modal.user.fullName}</p>
                                </div>
                                <button onClick={() => setModal(null)} className="ml-auto text-gray-400 hover:text-white transition"><CloseIcon /></button>
                            </div>
                            <div className="px-6 py-5">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nội dung cảnh cáo</label>
                                <textarea
                                    rows={4} placeholder="Mô tả lý do cảnh cáo..."
                                    value={warnMessage} onChange={(e) => setWarnMessage(e.target.value)}
                                    className="w-full text-sm border border-gray-700 rounded-xl p-3.5 bg-black placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none transition"
                                />
                            </div>
                            <div className="px-6 pb-5 flex justify-end gap-2.5">
                                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-xl hover:bg-gray-800 transition">Hủy</button>
                                <button onClick={executeWarn} className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-sm shadow-amber-600/30">Gửi cảnh cáo</button>
                            </div>
                        </div>
                    </ModalOverlay>
                )}

                {/* ── BAN MODAL ── */}
                {modal?.type === 'ban' && (
                    <ModalOverlay onClose={() => setModal(null)}>
                        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
                                <span className="w-8 h-8 rounded-full bg-rose-900/50 flex items-center justify-center text-rose-400"><BanIcon /></span>
                                <div>
                                    <h2 className="text-base font-bold text-white">Khóa tài khoản</h2>
                                    <p className="text-xs text-gray-400">{modal.user.fullName} · @{modal.user.userName}</p>
                                </div>
                                <button onClick={() => setModal(null)} className="ml-auto text-gray-400 hover:text-white transition"><CloseIcon /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lý do</label>
                                    <select value={banReason} onChange={(e) => setBanReason(e.target.value)}
                                        className="w-full text-sm border border-gray-700 rounded-xl px-3.5 py-2.5 bg-black text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition">
                                        <option value="Spam">Spam</option>
                                        <option value="Harassment">Quấy rối</option>
                                        <option value="HateSpeech">Ngôn từ thù ghét</option>
                                        <option value="FakeInfo">Thông tin giả mạo</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ghi chú (tuỳ chọn)</label>
                                    <textarea rows={3} placeholder="Chi tiết bổ sung..." value={banNote} onChange={(e) => setBanNote(e.target.value)}
                                        className="w-full text-sm border border-gray-700 rounded-xl p-3.5 bg-black placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 resize-none transition" />
                                </div>
                                <div className="bg-rose-900/30 border border-rose-800 rounded-xl px-4 py-3 text-xs text-rose-300">
                                    ⚠ Tài khoản sẽ bị khóa ngay lập tức. Người dùng sẽ không thể đăng nhập.
                                </div>
                            </div>
                            <div className="px-6 pb-5 flex justify-end gap-2.5">
                                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-xl hover:bg-gray-800 transition">Hủy</button>
                                <button onClick={executeBan} className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm shadow-rose-600/30">Xác nhận khóa</button>
                            </div>
                        </div>
                    </ModalOverlay>
                )}

                {/* ── DELETE MODAL ── */}
                {modal?.type === 'delete' && (
                    <ModalOverlay onClose={() => setModal(null)}>
                        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                            <div className="px-6 pt-6 pb-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-900/50 flex items-center justify-center text-rose-400 mb-4"><TrashIcon /></div>
                                <h2 className="text-lg font-bold text-white mb-1">Xóa vĩnh viễn tài khoản?</h2>
                                <p className="text-sm text-gray-400">Thao tác này <strong className="text-rose-400">không thể hoàn tác</strong>. Toàn bộ dữ liệu của <strong className="text-white">{modal.user.fullName}</strong> sẽ bị xóa khỏi hệ thống.</p>
                            </div>
                            <div className="px-6 pb-5">
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                    Nhập <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">XÁC NHẬN</code> để tiếp tục
                                </label>
                                <input type="text" placeholder="XÁC NHẬN" value={confirmDeleteText} onChange={(e) => setConfirmDeleteText(e.target.value)}
                                    className="w-full text-sm border border-gray-700 rounded-xl px-3.5 py-2.5 bg-black text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition" />
                            </div>
                            <div className="px-6 pb-5 flex justify-end gap-2.5">
                                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-xl hover:bg-gray-800 transition">Hủy</button>
                                <button disabled={confirmDeleteText !== 'XÁC NHẬN'} onClick={executeDelete}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">Xóa vĩnh viễn</button>
                            </div>
                        </div>
                    </ModalOverlay>
                )}

                {/* ── DRAWER ── */}
                {drawerUser && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDrawerUser(null)} />
                        <div className="relative w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Hồ sơ người dùng</h2>
                                <button onClick={() => setDrawerUser(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition"><CloseIcon /></button>
                            </div>
                            <div className="px-6 py-6 text-center border-b border-gray-800">
                                <div className="flex justify-center mb-3"><Avatar src={drawerUser.avatarUrl} name={drawerUser.fullName} size="lg" /></div>
                                <h3 className="text-lg font-bold text-white leading-tight">{drawerUser.fullName}</h3>
                                <p className="text-sm text-gray-400 mb-3">@{drawerUser.userName}</p>
                                <div className="flex justify-center"><StatusBadge status={drawerUser.status} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 px-6 py-5 border-b border-gray-800">
                                {[{ label: 'Người theo dõi', val: drawerUser.followerCount?.toLocaleString() ?? '—' }, { label: 'Bài viết', val: drawerUser.postCount?.toLocaleString() ?? '—' }].map((s) => (
                                    <div key={s.label} className="bg-black rounded-xl px-4 py-3 text-center">
                                        <p className="text-xl font-bold text-white">{s.val}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-5 space-y-3.5 border-b border-gray-800">
                                {[{ label: 'Email', val: drawerUser.email || '—' }, { label: 'Ngày tham gia', val: formatDate(drawerUser.joinedAt) }].map((d) => (
                                    <div key={d.label} className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{d.label}</span>
                                        <span className="text-sm text-gray-200 font-medium">{d.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-5 mt-auto space-y-2.5">
                                <Link to={`/admin/users/${drawerUser.id}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-pink-600/30"><EyeIcon /> Xem hồ sơ đầy đủ</Link>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => { setDrawerUser(null); openBanModal(drawerUser); }} className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-900/50 hover:bg-rose-900/70 text-rose-300 text-sm font-semibold rounded-xl transition border border-rose-800"><BanIcon /> Khóa</button>
                                    <button onClick={() => { setDrawerUser(null); openWarnModal(drawerUser); }} className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-900/50 hover:bg-amber-900/70 text-amber-300 text-sm font-semibold rounded-xl transition border border-amber-800"><WarnIcon /> Cảnh cáo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;