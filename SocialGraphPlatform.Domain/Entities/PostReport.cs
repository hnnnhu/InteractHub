// SocialGraphPlatform.Domain/Entities/PostReport.cs

using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    public class PostReport : AuditableEntity
    {
        public Guid PostId { get; private set; }
        public Guid ReporterId { get; private set; }

        public ReportReason Reason { get; private set; }
        public string? Details { get; private set; }

        public ReportStatus Status { get; private set; } = ReportStatus.Pending;

        public Guid? ProcessedById { get; private set; }
        public string? Notes { get; private set; }

        public virtual Post Post { get; private set; } = null!;
        public virtual User Reporter { get; private set; } = null!;
        public virtual User? ProcessedBy { get; private set; }

        protected PostReport() { }

        public PostReport(Guid postId, Guid reporterId, ReportReason reason, string? details = null)
        {
            PostId = postId;
            ReporterId = reporterId;
            Reason = reason;
            Details = details?.Trim();

            Status = ReportStatus.Pending;
            SetCreatedBy(reporterId);
        }

        public void Resolve(Guid adminId, string? notes = null)
        {
            if (Status == ReportStatus.Resolved || Status == ReportStatus.Dismissed)
                throw new InvalidOperationException("Báo cáo này đã được xử lý.");

            Status = ReportStatus.Resolved;
            ProcessedById = adminId;
            Notes = notes?.Trim();
            SetUpdated(adminId);
        }

        public void MarkAsReviewed(Guid adminId)
        {
            if (Status != ReportStatus.Pending)
                throw new InvalidOperationException("Chỉ báo cáo Pending mới có thể chuyển sang Reviewed.");

            Status = ReportStatus.Reviewed;
            SetUpdated(adminId);
        }

        public void Dismiss(Guid adminId, string? notes = null)
        {
            if (Status == ReportStatus.Resolved || Status == ReportStatus.Dismissed)
                throw new InvalidOperationException("Báo cáo này đã được đóng.");

            Status = ReportStatus.Dismissed;
            ProcessedById = adminId;
            Notes = notes?.Trim();
            SetUpdated(adminId);
        }
    }
}