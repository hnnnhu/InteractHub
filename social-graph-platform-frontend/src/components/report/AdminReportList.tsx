// components/report/AdminReportList.tsx
import React, { useState } from 'react';
import { useAllReports } from '../../hooks/report/useAllReports';
import { Link } from 'react-router-dom';
import ReportStatusBadge from './ReportStatusBadge';
import ReportReasonLabel from './ReportReasonLabel';
import { ReportStatus, ReportReason } from '../../types/report';

const AdminReportList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [reasonFilter, setReasonFilter] = useState<number | undefined>(undefined);
  const { data, isLoading, isError } = useAllReports({
    pageNumber: page,
    pageSize: 10,
    status: statusFilter as ReportStatus | undefined,
    reason: reasonFilter as ReportReason | undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <select
          value={statusFilter ?? ''}
          onChange={(e) => { setStatusFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="border rounded p-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value={ReportStatus.Pending}>Chờ duyệt</option>
          <option value={ReportStatus.Reviewed}>Đang xem xét</option>
          <option value={ReportStatus.Resolved}>Đã xử lý</option>
          <option value={ReportStatus.Dismissed}>Đã bác bỏ</option>
        </select>
        <select
          value={reasonFilter ?? ''}
          onChange={(e) => { setReasonFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="border rounded p-2 text-sm"
        >
          <option value="">Tất cả lý do</option>
          <option value={ReportReason.Spam}>Spam</option>
          <option value={ReportReason.Harassment}>Quấy rối</option>
          <option value={ReportReason.HateSpeech}>Kích động thù địch</option>
          <option value={ReportReason.NudityOrSexualContent}>Khiêu dâm</option>
          <option value={ReportReason.Violence}>Bạo lực</option>
          <option value={ReportReason.FalseInformation}>Sai lệch</option>
          <option value={ReportReason.Other}>Khác</option>
        </select>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-500">Đang tải danh sách...</div>}
      {isError && <div className="text-center py-8 text-red-500">Lỗi tải dữ liệu.</div>}

      {data?.items && data.items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Không có báo cáo nào.</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((report) => (
            <Link
              key={report.id}
              to={`/admin/reports/${report.id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {report.reporterFullName} (@{report.reporterUserName})
                    </span>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <div className="text-xs text-gray-500">
                    Bài viết: {report.postContent?.substring(0, 80)}...
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <ReportReasonLabel reason={report.reason} />
                    <span className="text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Trước</button>
          <span className="px-3 py-1 text-sm">{page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Sau</button>
        </div>
      )}
    </div>
  );
};

export default AdminReportList;