import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    Users, Activity, FileText, AlertTriangle,
    BarChart3, PieChartIcon, LayoutDashboard,
    CheckCircle, XCircle, AlertCircle, ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { reportApi } from '../../api/reportApi';
import type { AdminDashboard, AdminPost } from '../../types/admin';
import { ReportStatus, type PostReportResponse } from '../../types/report';

// ============================================================
// HELPERS
// ============================================================

const resolveUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const rootUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://localhost:7042';
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const COLORS = ['#FF1493', '#4F6BFF', '#FFB800', '#00C48C', '#FF6B6B'];

// ============================================================
// SKELETON LOADING
// ============================================================

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);

const CardSkeleton = () => <Skeleton className="h-28 w-full" />;
const ChartSkeleton = () => <Skeleton className="h-80 w-full" />;
const TableSkeleton = () => <Skeleton className="h-64 w-full" />;

// ============================================================
// KPI CARD (Glassmorphism)
// ============================================================

interface KPICardProps {
    title: string;
    value: number;
    changePercent?: number;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    urgent?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
    title, value, changePercent, icon, iconBg, iconColor, urgent,
}) => (
    <div
        className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 flex items-center gap-5 shadow-lg transition-all hover:scale-[1.02] ${urgent ? 'border-red-500/50' : 'border-white/10'
            }`}
    >
        <div className={`${iconBg} ${iconColor} p-3.5 rounded-xl`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{title}</p>
            <p className="text-3xl text-white font-bold tracking-tight mt-1.5">{value.toLocaleString()}</p>
            {changePercent !== undefined && (
                <p className={`text-sm mt-1.5 font-medium flex items-center gap-1 ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="text-base">{changePercent >= 0 ? '↑' : '↓'}</span>
                    {Math.abs(changePercent)}% so với tuần trước
                </p>
            )}
        </div>
    </div>
);

// ============================================================
// AVATAR
// ============================================================

const Avatar: React.FC<{ url?: string | null; fullName: string; size?: number }> = ({ url, fullName, size = 10 }) => {
    const [imgError, setImgError] = useState(false);
    const src = resolveUrl(url);
    const sizeClass = `w-${size} h-${size}`;

    if (!src || imgError) {
        return (
            <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] flex items-center justify-center text-white text-xs font-bold`}>
                {fullName.charAt(0).toUpperCase()}
            </div>
        );
    }
    return (
        <img src={src} alt={fullName} className={`${sizeClass} rounded-full object-cover`} onError={() => setImgError(true)} />
    );
};

// ============================================================
// PRIVACY BADGE
// ============================================================

const PrivacyBadge: React.FC<{ privacy: string }> = ({ privacy }) => {
    const map: Record<string, { label: string; className: string }> = {
        Public: { label: 'Công khai', className: 'bg-blue-500/20 text-blue-400' },
        FriendsOnly: { label: 'Bạn bè', className: 'bg-purple-500/20 text-purple-400' },
        Private: { label: 'Riêng tư', className: 'bg-yellow-500/20 text-yellow-400' },
        CloseFriends: { label: 'Bạn thân', className: 'bg-pink-500/20 text-pink-400' },
    };
    const item = map[privacy] || { label: privacy, className: 'bg-gray-500/20 text-gray-400' };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`}>
            {item.label}
        </span>
    );
};

// ============================================================
// DASHBOARD PAGE COMPONENT
// ============================================================

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState<AdminDashboard | null>(null);
    const [allPosts, setAllPosts] = useState<AdminPost[]>([]);
    const [pendingReports, setPendingReports] = useState<PostReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [dashboardRes, postsRes, reportsRes] = await Promise.all([
                    adminApi.getDashboard(),
                    adminApi.getPosts({ pageSize: 100 }),
                    reportApi.getAllReports({ pageNumber: 1, pageSize: 5, status: ReportStatus.Pending }),
                ]);

                if (dashboardRes.isSuccess && dashboardRes.data) setStats(dashboardRes.data);
                if (postsRes.isSuccess && postsRes.data) setAllPosts(postsRes.data.items);
                if (reportsRes.isSuccess && reportsRes.data) setPendingReports(reportsRes.data.items);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    // Các hàm xử lý báo cáo
    const handleResolve = async (reportId: string) => {
        const notes = prompt('Ghi chú (tuỳ chọn):');
        setActionLoading(reportId);
        try {
            const res = await reportApi.resolveReport(reportId, notes || null);
            if (res.isSuccess) {
                setPendingReports(prev => prev.filter(r => r.id !== reportId));
            } else {
                alert(res.message || 'Xử lý thất bại');
            }
        } catch (err) {
            alert('Xử lý thất bại: ' + (err instanceof Error ? err.message : ''));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDismiss = async (reportId: string) => {
        const notes = prompt('Lý do bác bỏ (tuỳ chọn):');
        setActionLoading(reportId);
        try {
            const res = await reportApi.dismissReport(reportId, notes || null);
            if (res.isSuccess) {
                setPendingReports(prev => prev.filter(r => r.id !== reportId));
            } else {
                alert(res.message || 'Bác bỏ thất bại');
            }
        } catch (err) {
            alert('Bác bỏ thất bại: ' + (err instanceof Error ? err.message : ''));
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkReviewed = async (reportId: string) => {
        setActionLoading(reportId);
        try {
            const res = await reportApi.markAsReviewed(reportId);
            if (res.isSuccess) {
                setPendingReports(prev => prev.filter(r => r.id !== reportId));
            } else {
                alert(res.message || 'Đánh dấu thất bại');
            }
        } catch (err) {
            alert('Đánh dấu thất bại: ' + (err instanceof Error ? err.message : ''));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TableSkeleton />
                    <TableSkeleton />
                </div>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-red-500 p-8">Không thể tải dữ liệu bảng điều khiển.</div>;
    }

    // ───── DỮ LIỆU CHO BIỂU ĐỒ ─────

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const postsCountByDay = last7Days.map(date => {
        const count = allPosts.filter(post => post.createdAt.startsWith(date)).length;
        return {
            date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            posts: count,
        };
    });

    const privacyDistribution = allPosts.reduce((acc, post) => {
        acc[post.privacy] = (acc[post.privacy] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const privacyChartData = Object.entries(privacyDistribution).map(([name, value]) => ({
        name: name === 'Public' ? 'Công khai' : name === 'FriendsOnly' ? 'Bạn bè' : name === 'Private' ? 'Riêng tư' : 'Bạn thân',
        value,
    }));

    // Hoạt động gần đây: 6 bài viết mới nhất
    const recentActivities = [...allPosts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-[#FF1493]" />
                Bảng điều khiển
            </h1>

            {/* ---- KPI CARDS ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Tổng người dùng" value={stats.totalUsers} changePercent={+12} icon={<Users className="w-6 h-6" />} iconBg="bg-[#FF1493]/20" iconColor="text-[#FF1493]" />
                <KPICard title="Hoạt động hôm nay" value={2840} changePercent={-3.5} icon={<Activity className="w-6 h-6" />} iconBg="bg-[#4F6BFF]/20" iconColor="text-[#4F6BFF]" />
                <KPICard title="Bài viết mới" value={stats.totalPosts} changePercent={+8.2} icon={<FileText className="w-6 h-6" />} iconBg="bg-[#00C48C]/20" iconColor="text-[#00C48C]" />
                <KPICard title="Báo cáo chờ xử lý" value={stats.pendingReports} icon={<AlertTriangle className="w-6 h-6" />} iconBg="bg-[#FF6B6B]/20" iconColor="text-[#FF6B6B]" urgent />
            </div>

            {/* ---- CHARTS ---- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Biểu đồ bài viết mới mỗi ngày */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#4F6BFF]" />
                        Bài viết mới mỗi ngày
                    </h3>
                    {allPosts.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">Chưa có dữ liệu bài viết</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={postsCountByDay} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis allowDecimals={false} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                                <Bar dataKey="posts" fill="#4F6BFF" radius={[6, 6, 0, 0]} maxBarSize={45} name="Bài viết" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Biểu đồ phân bố quyền riêng tư */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-[#FF1493]" />
                        Phân bố quyền riêng tư bài viết
                    </h3>
                    {privacyChartData.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">Chưa có dữ liệu</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                    <Pie data={privacyChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                                        {privacyChartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ---- DATA TABLES ---- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hoạt động gần đây (Recent Activities) */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#4F6BFF]" />
                        Hoạt động gần đây
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                                <tr>
                                    <th className="pb-3 pr-4 font-semibold">Tác giả</th>
                                    <th className="pb-3 pr-4 font-semibold">Nội dung</th>
                                    <th className="pb-3 pr-4 font-semibold">Quyền riêng tư</th>
                                    <th className="pb-3 font-semibold">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300 divide-y divide-white/5">
                                {recentActivities.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center">Chưa có hoạt động nào</td></tr>
                                ) : (
                                    recentActivities.map((post) => (
                                        <tr key={post.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3.5 pr-4 flex items-center gap-3">
                                                <Avatar url={null} fullName={post.authorName} size={8} />
                                                <div>
                                                    <p className="font-medium text-white">{post.authorName}</p>
                                                    <p className="text-xs text-gray-400">@{post.authorName?.toLowerCase()}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 max-w-[180px] truncate text-gray-400">{post.content?.substring(0, 60) || '—'}</td>
                                            <td className="py-3.5 pr-4"><PrivacyBadge privacy={post.privacy} /></td>
                                            <td className="py-3.5 text-gray-500 whitespace-nowrap">
                                                {new Date(post.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pending Reports */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#FF6B6B]" />
                        Báo cáo đang chờ
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                                <tr>
                                    <th className="pb-3 pr-4 font-semibold">Nội dung vi phạm</th>
                                    <th className="pb-3 pr-4 font-semibold">Người báo cáo</th>
                                    <th className="pb-3 pr-4 font-semibold">Lý do</th>
                                    <th className="pb-3 font-semibold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300 divide-y divide-white/5">
                                {pendingReports.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center">Không có báo cáo nào đang chờ</td></tr>
                                ) : (
                                    pendingReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3.5 pr-4 max-w-[160px] truncate text-gray-400">{report.postContent?.substring(0, 50) || '—'}</td>
                                            <td className="py-3.5 pr-4 font-medium text-white">{report.reporterFullName}</td>
                                            <td className="py-3.5 pr-4">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">{report.reasonLabel || 'Khác'}</span>
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleResolve(report.id)}
                                                        disabled={actionLoading === report.id}
                                                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Giải quyết"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismiss(report.id)}
                                                        disabled={actionLoading === report.id}
                                                        className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Bỏ qua"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkReviewed(report.id)}
                                                        disabled={actionLoading === report.id}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Xem xét"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/reports`)}
                                                        className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;