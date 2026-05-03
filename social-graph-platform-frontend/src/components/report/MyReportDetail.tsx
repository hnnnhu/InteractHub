// components/report/MyReportDetail.tsx
import React from 'react';
import { useMyReportDetail } from '../../hooks/report/useMyReportDetail';
import { useParams, Link } from 'react-router-dom';
import ReportStatusBadge from './ReportStatusBadge';
import ReportReasonLabel from './ReportReasonLabel';

const MyReportDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: report, isLoading, isError } = useMyReportDetail(id);

    if (isLoading) return <div className="text-center py-8">Đang tải chi tiết...</div>;
    if (isError || !report) return <div className="text-center py-8 text-red-500">Không tìm thấy báo cáo.</div>;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Link to="/my-reports" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
                ← Quay lại danh sách
            </Link>
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-900">Chi tiết báo cáo</h2>
                    <ReportStatusBadge status={report.status} />
                </div>

                <div>
                    <span className="text-sm font-medium text-gray-500">Bài viết bị báo cáo</span>
                    <p className="mt-1 text-gray-800">{report.postContent || 'Nội dung trống'}</p>
                    <p className="text-xs text-gray-400">Tác giả: @{report.postAuthorUserName}</p>
                </div>

                <div>
                    <span className="text-sm font-medium text-gray-500">Lý do</span>
                    <div className="mt-1"><ReportReasonLabel reason={report.reason} /></div>
                    {report.details && <p className="mt-2 text-sm text-gray-600">{report.details}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Ngày gửi</span>
                        <p>{new Date(report.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    {report.updatedAt && (
                        <div>
                            <span className="text-gray-500">Cập nhật lần cuối</span>
                            <p>{new Date(report.updatedAt).toLocaleString('vi-VN')}</p>
                        </div>
                    )}
                    {report.processedByUserName && (
                        <div>
                            <span className="text-gray-500">Người xử lý</span>
                            <p>{report.processedByUserName}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyReportDetail;