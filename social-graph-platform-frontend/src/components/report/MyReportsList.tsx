// components/report/MyReportsList.tsx
import React from 'react';
import { useMyReports } from '../../hooks/report/useMyReports';
import { Link } from 'react-router-dom';
import ReportStatusBadge from './ReportStatusBadge';
import ReportReasonLabel from './ReportReasonLabel';

const MyReportsList: React.FC = () => {
    const [page, setPage] = React.useState(1);
    const { data, isLoading, isError } = useMyReports({ pageNumber: page, pageSize: 10 });

    if (isLoading) return <div className="text-center py-8 text-gray-500">Đang tải...</div>;
    if (isError) return <div className="text-center py-8 text-red-500">Có lỗi xảy ra.</div>;

    const reports = data?.items ?? [];

    return (
        <div className="space-y-4">
            {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Bạn chưa gửi báo cáo nào.</div>
            ) : (
                reports.map((report) => (
                    <Link
                        key={report.id}
                        to={`/my-reports/${report.id}`}
                        className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                    Bài viết: {report.postContent?.substring(0, 100) || 'Không có nội dung'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <ReportReasonLabel reason={report.reason} />
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            <ReportStatusBadge status={report.status} />
                        </div>
                    </Link>
                ))
            )}
            {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <span className="px-3 py-1 text-sm">
                        {page} / {data.totalPages}
                    </span>
                    <button
                        disabled={page >= data.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyReportsList;