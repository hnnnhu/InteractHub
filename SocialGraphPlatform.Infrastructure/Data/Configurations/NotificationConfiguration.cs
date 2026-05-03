using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Notification (Thông báo)
    /// </summary>
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");

            // ==================== KEY ====================
            builder.HasKey(n => n.Id);

            // ==================== PROPERTIES ====================
            builder.Property(n => n.ReceiverId)
                   .IsRequired();

            builder.Property(n => n.TriggeredById);           // Có thể null (thông báo hệ thống)

            builder.Property(n => n.Type)
                   .HasConversion<string>()                   // Dễ debug và migrate
                   .IsRequired();

            builder.Property(n => n.Content)
                   .IsRequired()
                   .HasMaxLength(1000);

            builder.Property(n => n.TargetUrl)
                   .HasMaxLength(500);

            builder.Property(n => n.RelatedEntityId);

            builder.Property(n => n.IsRead)
                   .IsRequired()
                   .HasDefaultValue(false);

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(n => !n.IsDeleted);

            // ==================== INDEXES (Tối ưu hiệu năng) ====================

            // Index chính: Lấy danh sách thông báo của user + sắp xếp theo thời gian mới nhất
            builder.HasIndex(n => new { n.ReceiverId, n.CreatedAt })
                   .IsDescending();

            // Index quan trọng nhất: Đếm thông báo chưa đọc (cho icon chuông)
            builder.HasIndex(n => new { n.ReceiverId, n.IsRead })
                   .HasFilter("[IsRead] = 0 AND [IsDeleted] = 0");

            // Index cho RelatedEntityId (tìm thông báo liên quan đến một Post, Comment, Story...)
            builder.HasIndex(n => n.RelatedEntityId);

            // ==================== RELATIONSHIPS ====================

            // Notification (N) → Receiver (1)
            builder.HasOne(n => n.Receiver)
                   .WithMany(u => u.NotificationsReceived)
                   .HasForeignKey(n => n.ReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Notification (N) → TriggeredBy (1) - Optional
            builder.HasOne(n => n.TriggeredBy)
                   .WithMany()                                 // User không cần ICollection thông báo gửi đi
                   .HasForeignKey(n => n.TriggeredById)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}