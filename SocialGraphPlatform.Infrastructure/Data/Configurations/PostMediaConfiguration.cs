using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho PostMedia (Ảnh/Video đính kèm trong bài viết)
    /// </summary>
    public class PostMediaConfiguration : IEntityTypeConfiguration<PostMedia>
    {
        public void Configure(EntityTypeBuilder<PostMedia> builder)
        {
            builder.ToTable("PostMedias");

            // ==================== KEY ====================
            builder.HasKey(pm => pm.Id);

            // ==================== PROPERTIES ====================
            builder.Property(pm => pm.PostId)
                   .IsRequired();

            builder.Property(pm => pm.MediaUrl)
                   .IsRequired()
                   .HasMaxLength(500);

            builder.Property(pm => pm.Type)
                   .HasConversion<string>()           // Khuyến nghị: lưu dạng string
                   .IsRequired();

            builder.Property(pm => pm.SortOrder)
                   .IsRequired()
                   .HasDefaultValue(0);

            // ==================== GLOBAL QUERY FILTER (Soft Delete) ====================
            builder.HasQueryFilter(pm => !pm.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(pm => pm.PostId);

            // Index composite giúp query media theo thứ tự nhanh hơn
            builder.HasIndex(pm => new { pm.PostId, pm.SortOrder });

            // ==================== RELATIONSHIP ====================
            builder.HasOne(pm => pm.Post)
                   .WithMany(p => p.MediaItems)
                   .HasForeignKey(pm => pm.PostId)
                   .OnDelete(DeleteBehavior.Cascade);   // Xóa Post → xóa luôn các Media
        }
    }
}