using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể PostReport (Báo cáo vi phạm bài viết)
    /// </summary>
    public class PostReportConfiguration : IEntityTypeConfiguration<PostReport>
    {
        public void Configure(EntityTypeBuilder<PostReport> builder)
        {
            builder.ToTable("PostReports");

            // ==================== KEY ====================
            builder.HasKey(r => r.Id);

            // ==================== PROPERTIES ====================
            builder.Property(r => r.PostId)
                   .IsRequired();

            builder.Property(r => r.ReporterId)
                   .IsRequired();

            builder.Property(r => r.Reason)
                   .HasConversion<string>()           // Lưu dạng string dễ đọc ("Spam", "Violence"...)
                   .IsRequired();

            builder.Property(r => r.Details)
                   .HasMaxLength(1000);

            builder.Property(r => r.Status)
                   .HasConversion<string>()
                   .IsRequired()
                   .HasDefaultValue(ReportStatus.Pending)
                   .HasSentinel(ReportStatus.Pending);

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(r => !r.IsDeleted);

            // ==================== INDEXES (Tối ưu cho Admin Dashboard) ====================

            // Index cho lọc theo trạng thái (Pending, Reviewed, Resolved...)
            builder.HasIndex(r => r.Status);


            // Index lấy tất cả báo cáo của một bài viết
            builder.HasIndex(r => r.PostId);

            // Index thống kê user hay report (phát hiện spam report)
            builder.HasIndex(r => r.ReporterId);

            // Index composite: Tránh report lặp lại cùng post + reporter
            builder.HasIndex(r => new { r.PostId, r.ReporterId });

            // ==================== RELATIONSHIPS ====================

            // PostReport (N) → Post (1)
            builder.HasOne(r => r.Post)
                   .WithMany(p => p.Reports)
                   .HasForeignKey(r => r.PostId)
                   .OnDelete(DeleteBehavior.Cascade);     // Xóa Post → xóa báo cáo liên quan

            // PostReport (N) → Reporter (1)
            builder.HasOne(r => r.Reporter)
                   .WithMany(u => u.PostReports)           // Phải khớp với tên navigation trong User
                   .HasForeignKey(r => r.ReporterId)
                   .OnDelete(DeleteBehavior.Restrict);     // Không cascade để giữ lịch sử report
        }
    }
}