// components/report/AdminReportDetail.tsx
import React, { useState } from 'react';
import { useReportDetail } from '../../hooks/report/useReportDetail';
import { useResolveReport } from '../../hooks/report/useResolveReport';
import { useReviewReport } from '../../hooks/report/useReviewReport';
import { useDismissReport } from '../../hooks/report/useDismissReport';
import { useParams, Link } from 'react-router-dom';
import ReportStatusBadge from './ReportStatusBadge';
import ReportReasonLabel from './ReportReasonLabel';
import { ReportStatus } from '../../types/report';

const AdminReportDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: report, isLoading, isError } = useReportDetail(id);
    const { mutate: resolve, isPending: resolving } = useResolveReport();
    const { mutate: review, isPending: reviewing } = useReviewReport();
    const { mutate: dismiss, isPending: dismissing } = useDismissReport();

    const [notes, setNotes] = useState('');
    const [action, setAction] = useState<'resolve' | 'dismiss' | null>(null);

    if (isLoading) return <div className="text-center py-8">Đang tải chi tiết báo cáo...</div>;
    if (isError || !report) return <div className="text-center py-8 text-red-500">Không tìm thấy báo cáo.</div>;

    const handleReview = () => {
        if (!id) return;
        review(id);
    };

    const handleResolve = () => {
        if (!id) return;
        resolve({ reportId: id, notes: notes || null });
        setAction(null);
        setNotes('');
    };

    const handleDismiss = () => {
        if (!id) return;
        dismiss({ reportId: id, notes: notes || null });
        setAction(null);
        setNotes('');
    };

    const canReview = report.status === ReportStatus.Pending;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <Link to="/admin/reports" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
                ← Quay lại danh sách
            </Link>
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-900">Chi tiết báo cáo</h2>
                    <ReportStatusBadge status={report.status} />
                </div>

                {/* Thông tin người báo cáo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm font-medium text-gray-500">Người báo cáo</span>
                        <p className="font-medium">{report.reporterFullName} (@{report.reporterUserName})</p>
                        {report.reporterAvatarUrl && <img src={report.reporterAvatarUrl} alt="" className="w-8 h-8 rounded-full mt-1" />}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500">Bài viết bị báo cáo</span>
                        <p className="text-gray-800 mt-1">{report.postContent || 'Nội dung trống'}</p>
                        <p className="text-xs text-gray-400">Tác giả: @{report.postAuthorUserName}</p>
                        {report.postMediaUrl && <img src={report.postMediaUrl} alt="" className="mt-2 rounded max-h-40" />}
                    </div>
                </div>

                <div>
                    <span className="text-sm font-medium text-gray-500">Lý do</span>
                    <div className="mt-1"><ReportReasonLabel reason={report.reason} /></div>
                    {report.details && <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">{report.details}</p>}
                </div>

                {/* Thông tin thời gian & người xử lý */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Ngày gửi</span>
                        <p>{new Date(report.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    {report.updatedAt && (
                        <div>
                            <span className="text-gray-500">Cập nhật</span>
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

                {/* Hành động Admin */}
                <div className="border-t pt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Hành động quản trị</h3>
                    <div className="flex flex-wrap gap-2">
                        {canReview && (
                            <button
                                onClick={handleReview}
                                disabled={reviewing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                {reviewing ? 'Đang cập nhật...' : 'Đánh dấu đang xem xét'}
                            </button>
                        )}
                        <button
                            onClick={() => setAction('resolve')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                            Xử lý (Resolve)
                        </button>
                        <button
                            onClick={() => setAction('dismiss')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                            Bác bỏ (Dismiss)
                        </button>
                    </div>

                    {action && (
                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <p className="text-sm font-medium">
                                {action === 'resolve' ? 'Ghi chú xử lý (tuỳ chọn)' : 'Ghi chú bác bỏ (tuỳ chọn)'}
                            </p>
                            <textarea
                                rows={2}
                                className="w-full border rounded p-2 text-sm"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={500}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={action === 'resolve' ? handleResolve : handleDismiss}
                                    disabled={resolving || dismissing}
                                    className={`px-4 py-1.5 text-sm rounded-md text-white ${action === 'resolve' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                                        } disabled:opacity-50`}
                                >
                                    {resolving || dismissing ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                                <button onClick={() => { setAction(null); setNotes(''); }} className="px-4 py-1.5 text-sm border rounded-md">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetail;