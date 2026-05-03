using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể SavedPost (Bài viết đã lưu / Bookmark)
    /// Hỗ trợ nhiều bộ sưu tập (Collection) và cơ chế Soft Delete + Restore.
    /// </summary>
    public class SavedPostConfiguration : IEntityTypeConfiguration<SavedPost>
    {
        public void Configure(EntityTypeBuilder<SavedPost> builder)
        {
            builder.ToTable("SavedPosts");

            // ==================== KEY ====================
            builder.HasKey(sp => sp.Id);

            // ==================== PROPERTIES ====================
            builder.Property(sp => sp.UserId)
                   .IsRequired();

            builder.Property(sp => sp.PostId)
                   .IsRequired();

            builder.Property(sp => sp.CollectionName)
                   .IsRequired()
                   .HasMaxLength(100)
                   .HasDefaultValue("Mặc định");

            // ==================== UNIQUE CONSTRAINT (RẤT QUAN TRỌNG) ====================
            // Đảm bảo một người không thể lưu cùng một bài viết nhiều lần
            // Kết hợp với logic SaveAgain() trong Entity để tái sử dụng bản ghi
            builder.HasIndex(sp => new { sp.UserId, sp.PostId })
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(sp => !sp.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(sp => sp.UserId);                    // Load danh sách saved posts của user
            builder.HasIndex(sp => new { sp.UserId, sp.CollectionName }); // Load theo bộ sưu tập

            // ==================== RELATIONSHIPS ====================

            // SavedPost (N) → User (1)
            builder.HasOne(sp => sp.User)
                   .WithMany(u => u.SavedPosts)
                   .HasForeignKey(sp => sp.UserId)
                   .OnDelete(DeleteBehavior.Cascade);     // Xóa User → xóa danh sách lưu của họ

            // SavedPost (N) → Post (1)
            builder.HasOne(sp => sp.Post)
                   .WithMany(p => p.SavedByUsers)
                   .HasForeignKey(sp => sp.PostId)
                   .OnDelete(DeleteBehavior.Cascade);     // Xóa Post → xóa bản ghi lưu
        }
    }
}