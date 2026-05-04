using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
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

            builder.Property(n => n.TriggeredById);

            builder.Property(n => n.Type)
                   .HasConversion<string>()
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

            // ==================== INDEXES ====================
            builder.HasIndex(n => new { n.ReceiverId, n.CreatedAt })
                   .IsDescending();

            // PostgreSQL dùng dấu ngoặc kép và "false" thay vì [Column] = 0
            builder.HasIndex(n => new { n.ReceiverId, n.IsRead })
                   .HasFilter("\"IsRead\" = false AND \"IsDeleted\" = false");

            builder.HasIndex(n => n.RelatedEntityId);

            // ==================== RELATIONSHIPS ====================
            builder.HasOne(n => n.Receiver)
                   .WithMany(u => u.NotificationsReceived)
                   .HasForeignKey(n => n.ReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(n => n.TriggeredBy)
                   .WithMany()
                   .HasForeignKey(n => n.TriggeredById)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}