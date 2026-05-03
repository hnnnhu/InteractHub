using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Hashtag
    /// Đảm bảo mỗi hashtag chỉ tồn tại duy nhất một bản ghi (Unique)
    /// </summary>
    public class HashtagConfiguration : IEntityTypeConfiguration<Hashtag>
    {
        public void Configure(EntityTypeBuilder<Hashtag> builder)
        {
            builder.ToTable("Hashtags");

            // ==================== KEY ====================
            builder.HasKey(h => h.Id);

            // ==================== PROPERTIES ====================
            builder.Property(h => h.Name)
                   .IsRequired()
                   .HasMaxLength(100);

            // ==================== UNIQUE CONSTRAINT (CỰC KỲ QUAN TRỌNG) ====================
            // Đảm bảo không bao giờ có 2 hashtag trùng tên (ví dụ: "dotnet" chỉ được tồn tại 1 lần)
            // Điều này giúp hệ thống Trending và tìm kiếm hashtag chính xác và tối ưu
            builder.HasIndex(h => h.Name)
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            // builder.HasQueryFilter(h => !h.IsDeleted);

            // ==================== RELATIONSHIPS ====================
            // Hashtag (1) - PostHashtag (N) - Junction Table
            builder.HasMany(h => h.PostHashtags)
                   .WithOne(ph => ph.Hashtag)
                   .HasForeignKey(ph => ph.HashtagId)
                   .OnDelete(DeleteBehavior.Cascade);   // Xóa Hashtag → xóa liên kết với bài viết
        }
    }
}