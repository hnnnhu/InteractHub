using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể StoryView (Lượt xem Tin 24h)
    /// </summary>
    public class StoryViewConfiguration : IEntityTypeConfiguration<StoryView>
    {
        public void Configure(EntityTypeBuilder<StoryView> builder)
        {
            builder.ToTable("StoryViews");

            // ==================== KEY ====================
            builder.HasKey(sv => sv.Id);

            // ==================== PROPERTIES ====================
            builder.Property(sv => sv.StoryId)
                   .IsRequired();

            builder.Property(sv => sv.ViewerId)
                   .IsRequired();

            // ==================== UNIQUE CONSTRAINT (RẤT QUAN TRỌNG) ====================
            // Bảo vệ nghiệp vụ: 1 người chỉ xem 1 lần một Story
            builder.HasIndex(sv => new { sv.StoryId, sv.ViewerId })
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(sv => !sv.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(sv => sv.StoryId);      // Tăng tốc khi đếm lượt xem của Story
            builder.HasIndex(sv => sv.ViewerId);     // Tăng tốc khi xem lịch sử xem của User
            builder.HasIndex(sv => sv.CreatedAt);    // Hữu ích khi query theo thời gian xem

            // ==================== RELATIONSHIPS ====================

            // StoryView (N) - Story (1)
            builder.HasOne(sv => sv.Story)
                   .WithMany(s => s.Views)
                   .HasForeignKey(sv => sv.StoryId)
                   .OnDelete(DeleteBehavior.Cascade);   // Xóa Story → xóa lượt xem

            // StoryView (N) - User (Viewer) (1)
            builder.HasOne(sv => sv.Viewer)
                   .WithMany()                           // User không cần ICollection<StoryView>
                   .HasForeignKey(sv => sv.ViewerId)
                   .OnDelete(DeleteBehavior.Restrict);   // Tránh Multiple Cascade Paths từ User
        }
    }
}