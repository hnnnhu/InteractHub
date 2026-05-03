using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình cho bảng trung gian PostHashtag (Many-to-Many)
    /// Đã khắc phục warning 10622 cho cả hai chiều (Post và Hashtag)
    /// </summary>
    public class PostHashtagConfiguration : IEntityTypeConfiguration<PostHashtag>
    {
        public void Configure(EntityTypeBuilder<PostHashtag> builder)
        {
            builder.ToTable("PostHashtags");

            // ==================== COMPOSITE KEY ====================
            builder.HasKey(ph => new { ph.PostId, ph.HashtagId });

            // ==================== PROPERTIES ====================
            builder.Property(ph => ph.PostId).IsRequired();
            builder.Property(ph => ph.HashtagId).IsRequired();

            // ==================== INDEXES ====================
            builder.HasIndex(ph => ph.PostId);
            builder.HasIndex(ph => ph.HashtagId);
            builder.HasIndex(ph => new { ph.HashtagId, ph.PostId }); // Hỗ trợ query hashtag

            // ==================== RELATIONSHIPS ====================

            // PostHashtag → Post (1)
            // Post có Global Query Filter → phải làm Optional để tránh warning
            builder.HasOne(ph => ph.Post)
                   .WithMany(p => p.PostHashtags)
                   .HasForeignKey(ph => ph.PostId)
                   .OnDelete(DeleteBehavior.Cascade)
                   .IsRequired(false);        // ← FIX WARNING CHO Post

            // PostHashtag → Hashtag (1)
            // Hashtag có Global Query Filter → phải làm Optional
            builder.HasOne(ph => ph.Hashtag)
                   .WithMany(h => h.PostHashtags)
                   .HasForeignKey(ph => ph.HashtagId)
                   .OnDelete(DeleteBehavior.Cascade)
                   .IsRequired(false);        // ← FIX WARNING CHO Hashtag
        }
    }
}