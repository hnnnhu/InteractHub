using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Story (Tin 24h)
    /// </summary>
    public class StoryConfiguration : IEntityTypeConfiguration<Story>
    {
        public void Configure(EntityTypeBuilder<Story> builder)
        {
            builder.ToTable("Stories");

            // ==================== KEY ====================
            builder.HasKey(s => s.Id);

            // ==================== PROPERTIES ====================
            builder.Property(s => s.UserId)
                   .IsRequired();

            builder.Property(s => s.MediaUrl)
                   .HasMaxLength(500);

            builder.Property(s => s.Content)
                   .HasMaxLength(1000);

            builder.Property(s => s.Type)
                   .HasConversion<string>()           // Dễ debug và migrate
                   .IsRequired();

            builder.Property(s => s.Privacy)
                   .HasConversion<string>()
                   .IsRequired()
                   .HasDefaultValue(PrivacyLevel.Public)
                   .HasSentinel(PrivacyLevel.Public);


            builder.Property(s => s.ExpiresAt)
                   .IsRequired();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(s => !s.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(s => s.UserId);
            builder.HasIndex(s => s.ExpiresAt);        // Quan trọng cho job dọn dẹp story hết hạn
            builder.HasIndex(s => s.CreatedAt);

            // ==================== RELATIONSHIPS ====================

            // Story (N) - User (1)
            builder.HasOne(s => s.User)
                   .WithMany(u => u.Stories)
                   .HasForeignKey(s => s.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Story (1) - StoryView (N)
            // Sử dụng Backing Field "_views"
            builder.HasMany(s => s.Views)
                   .WithOne(sv => sv.Story)
                   .HasForeignKey(sv => sv.StoryId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Cấu hình rõ ràng Property Access Mode cho Backing Field
            builder.Metadata
                .FindNavigation(nameof(Story.Views))!
                .SetPropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}