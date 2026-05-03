// src/pages/admin/AdminReportsPage.tsx
// Giao diện quản lý báo cáo chuyên nghiệp – Đã sửa lỗi import và trường notes

import React, { useState } from 'react';
import { useAllReports } from '../../hooks/report/useAllReports';
import { useResolveReport } from '../../hooks/report/useResolveReport';
import { useDismissReport } from '../../hooks/report/useDismissReport';
import { useReviewReport } from '../../hooks/report/useReviewReport';
import {
    ReportStatus,
    ReportReason,
    ReportReasonDescriptions,
} from '../../types/report';
import type { ReportFilterParams, PostReportResponse } from '../../types/report';
import {
    Filter, FileText, AlertTriangle,
    Shield, ChevronLeft, ChevronRight, Eye, X,
    CheckCircle, XCircle, Clock,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = import.meta.env.VITE_API_URL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getStatusBadge = (status: ReportStatus) => {
    const map: Record<number, { label: string; className: string; icon: React.ReactNode }> = {
        [ReportStatus.Pending]: {
            label: 'Chờ xử lý',
            className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            icon: <Clock className="w-3 h-3" />,
        },
        [ReportStatus.Reviewed]: {
            label: 'Đã xem xét',
            className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            icon: <Eye className="w-3 h-3" />,
        },
        [ReportStatus.Resolved]: {
            label: 'Đã giải quyết',
            className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            icon: <CheckCircle className="w-3 h-3" />,
        },
        [ReportStatus.Dismissed]: {
            label: 'Đã bác bỏ',
            className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            icon: <XCircle className="w-3 h-3" />,
        },
    };
    const item = map[status] || { label: 'Không xác định', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${item.className}`}>
            {item.icon}
            {item.label}
        </span>
    );
};

// ──────────────────────────────────────────────────────────────
// REPORT DETAIL MODAL
// ──────────────────────────────────────────────────────────────

const ReportDetailModal: React.FC<{
    report: PostReportResponse | null;
    onClose: () => void;
}> = ({ report, onClose }) => {
    if (!report) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-xl p-5 border-b border-white/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FF1493]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#FF1493]" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Chi tiết báo cáo</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Người báo cáo</p>
                            <div className="flex items-center gap-2">
                                {report.reporterAvatarUrl ? (
                                    <img
                                        src={resolveUrl(report.reporterAvatarUrl)!}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] flex items-center justify-center text-white text-sm font-bold">
                                        {report.reporterFullName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">{report.reporterFullName}</p>
                                    <p className="text-xs text-gray-400">@{report.reporterUserName}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ngày tạo</p>
                            <p className="text-sm text-gray-300">{formatDate(report.createdAt)}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Nội dung bài viết bị báo cáo</p>
                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-gray-300">{report.postContent || '—'}</p>
                            <p className="text-xs text-gray-500 mt-1">bởi @{report.postAuthorUserName}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Lý do báo cáo</p>
                        <p className="text-sm text-gray-300">
                            {report.reasonLabel || ReportReasonDescriptions[report.reason] || 'Khác'}
                        </p>
                    </div>

                    {/* Không hiển thị ghi chú vì PostReportResponse không có trường notes */}

                    <div className="flex items-center gap-2 text-sm text-gray-400 pt-4 border-t border-white/10">
                        <Clock className="w-4 h-4" />
                        Cập nhật lần cuối: {formatDate(report.updatedAt || report.createdAt)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

const AdminReportsPage: React.FC = () => {
    const pageSize = 10;

    const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);
    const [reasonFilter, setReasonFilter] = useState<ReportReason | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<PostReportResponse | null>(null);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? (Number(e.target.value) as ReportStatus) : undefined;
        setStatusFilter(value);
        setPage(1);
    };

    const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? (Number(e.target.value) as ReportReason) : undefined;
        setReasonFilter(value);
        setPage(1);
    };

    const queryParams: ReportFilterParams = {
        pageNumber: page,
        pageSize,
        status: statusFilter,
        reason: reasonFilter,
    };

    const {
        data: reportsData,
        isLoading,
        isError,
        error,
        refetch,
    } = useAllReports(queryParams);

    const { mutateAsync: resolveReport, isPending: isResolving } = useResolveReport();
    const { mutateAsync: dismissReport, isPending: isDismissing } = useDismissReport();
    const { mutateAsync: reviewReport, isPending: isReviewing } = useReviewReport();

    const handleAction = async (
        action: 'resolve' | 'dismiss' | 'review',
        reportId: string,
        notes?: string | null
    ) => {
        try {
            if (action === 'resolve') {
                await resolveReport({ reportId, notes: notes || null });
            } else if (action === 'dismiss') {
                await dismissReport({ reportId, notes: notes || null });
            } else {
                await reviewReport(reportId);
            }
            refetch();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Thao tác thất bại';
            alert(message);
        }
    };

    const totalPages = reportsData?.totalPages ?? 0;
    const currentPage = reportsData?.pageNumber ?? page;
    const totalItems = reportsData?.totalCount ?? 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Quản lý báo cáo</h1>
                    <p className="text-sm text-gray-500 mt-1">Xem xét và xử lý các báo cáo vi phạm</p>
                </div>
                {!isLoading && totalItems > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/5">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium text-gray-300">{totalItems.toLocaleString()}</span> báo cáo
                    </div>
                )}
            </div>

            {/* Bộ lọc */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={statusFilter ?? ''}
                        onChange={handleStatusChange}
                        className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1493]/30 focus:border-[#FF1493]/30 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value={ReportStatus.Pending}>Đang chờ</option>
                        <option value={ReportStatus.Reviewed}>Đã xem xét</option>
                        <option value={ReportStatus.Resolved}>Đã giải quyết</option>
                        <option value={ReportStatus.Dismissed}>Đã bác bỏ</option>
                    </select>
                </div>
                <div className="relative flex-1">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={reasonFilter ?? ''}
                        onChange={handleReasonChange}
                        className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1493]/30 focus:border-[#FF1493]/30 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Tất cả lý do</option>
                        {Object.entries(ReportReason)
                            .filter(([key]) => isNaN(Number(key)))
                            .map(([key, value]) => (
                                <option key={key} value={value}>
                                    {ReportReasonDescriptions?.[value as ReportReason] || key}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-[#1A1A1C] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-3 sm:w-[200px] shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3 bg-white/[0.06] rounded w-24" />
                                        <div className="h-2 bg-white/[0.06] rounded w-16" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                                    <div className="h-2 bg-white/[0.06] rounded w-1/2" />
                                </div>
                                <div className="sm:w-[150px] shrink-0 flex gap-2">
                                    <div className="h-8 w-16 bg-white/[0.06] rounded-lg" />
                                    <div className="h-8 w-16 bg-white/[0.06] rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error instanceof Error ? error.message : 'Lỗi khi tải danh sách báo cáo'}</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="shrink-0 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Danh sách báo cáo */}
            {!isLoading && !isError && reportsData && reportsData.items.length > 0 && (
                <div className="space-y-3">
                    {reportsData.items.map((report) => (
                        <article
                            key={report.id}
                            className="bg-[#1A1A1C] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300"
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Thông tin người báo cáo */}
                                <div className="flex items-center gap-3 sm:w-[220px] shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] flex items-center justify-center text-white font-bold shrink-0">
                                        {report.reporterFullName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-100 truncate">{report.reporterFullName}</p>
                                        <p className="text-xs text-gray-500 truncate">@{report.reporterUserName}</p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time>
                                        </div>
                                    </div>
                                </div>

                                {/* Nội dung báo cáo */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 line-clamp-2 break-words">
                                        {report.postContent?.substring(0, 120) || '—'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span className="font-medium text-gray-400">
                                            {report.reasonLabel || ReportReasonDescriptions[report.reason] || 'Khác'}
                                        </span>
                                        <span className="text-gray-600">|</span>
                                        <span>bởi @{report.postAuthorUserName}</span>
                                    </div>
                                </div>

                                {/* Trạng thái & hành động */}
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:w-[180px] shrink-0">
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(report.status)}
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {(report.status === ReportStatus.Pending ||
                                            report.status === ReportStatus.Reviewed) && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction('resolve', report.id)}
                                                        disabled={isResolving}
                                                        className="px-3 py-1.5 text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-lg hover:bg-emerald-600/20 disabled:opacity-50 transition-colors"
                                                    >
                                                        Giải quyết
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('dismiss', report.id)}
                                                        disabled={isDismissing}
                                                        className="px-3 py-1.5 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-lg hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
                                                    >
                                                        Bác bỏ
                                                    </button>
                                                </>
                                            )}
                                        {report.status === ReportStatus.Pending && (
                                            <button
                                                onClick={() => handleAction('review', report.id)}
                                                disabled={isReviewing}
                                                className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                                            >
                                                Đánh dấu đã xem
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && reportsData && reportsData.items.length === 0 && (
                <div className="text-center py-20 bg-[#1A1A1C] rounded-2xl border border-white/[0.06]">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/[0.03] flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Không có báo cáo nào</h3>
                    <p className="text-sm text-gray-600 mb-6">Mọi thứ đang trong tầm kiểm soát.</p>
                </div>
            )}

            {/* Phân trang */}
            {reportsData && totalPages > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/[0.06] gap-4">
                    <div className="text-sm text-gray-400">
                        Trang {currentPage} / {totalPages} (Tổng {totalItems.toLocaleString()} báo cáo)
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hidden sm:block"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <ChevronLeft className="w-4 h-4 -ml-3" />
                        </button>
                        <button
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-2.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pageNum === currentPage
                                                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-2.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hidden sm:block"
                        >
                            <ChevronRight className="w-4 h-4" />
                            <ChevronRight className="w-4 h-4 -ml-3" />
                        </button>
                    </div>
                </div>
            )}

            <ReportDetailModal
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
            />
        </div>
    );
};

export default AdminReportsPage;