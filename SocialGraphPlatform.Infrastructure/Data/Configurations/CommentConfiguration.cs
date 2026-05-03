using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Bình luận (Comment) - Hỗ trợ cấu trúc cây (Reply)
    /// </summary>
    public class CommentConfiguration : IEntityTypeConfiguration<Comment>
    {
        public void Configure(EntityTypeBuilder<Comment> builder)
        {
            builder.ToTable("Comments");

            // ==================== KEY ====================
            builder.HasKey(c => c.Id);

            // ==================== PROPERTIES ====================
            builder.Property(c => c.PostId)
                   .IsRequired();

            builder.Property(c => c.UserId)
                   .IsRequired();

            builder.Property(c => c.Content)
                   .IsRequired()
                   .HasMaxLength(2000);

            builder.Property(c => c.ParentCommentId)
                   .IsRequired(false);        // Cho phép là bình luận gốc (null)

            // ==================== GLOBAL QUERY FILTER (Soft Delete) ====================
            builder.HasQueryFilter(c => !c.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(c => c.PostId);
            builder.HasIndex(c => c.UserId);
            builder.HasIndex(c => c.ParentCommentId);
            builder.HasIndex(c => c.CreatedAt);        // Rất hữu ích khi sắp xếp theo thời gian

            // ==================== RELATIONSHIPS ====================

            // Comment (N) - Post (1)
            builder.HasOne(c => c.Post)
                   .WithMany(p => p.Comments)
                   .HasForeignKey(c => c.PostId)
                   .OnDelete(DeleteBehavior.Cascade);     // Xóa Post → xóa tất cả comment

            // Comment (N) - User (1)
            builder.HasOne(c => c.User)
                   .WithMany(u => u.Comments)
                   .HasForeignKey(c => c.UserId)
                   .OnDelete(DeleteBehavior.Restrict);    // Tránh Multiple Cascade Paths từ User

            // Self-referencing: Comment - Replies (Cây bình luận)
            builder.HasOne(c => c.ParentComment)
                   .WithMany(c => c.Replies)
                   .HasForeignKey(c => c.ParentCommentId)
                   .OnDelete(DeleteBehavior.Restrict);    // Dùng Restrict để tránh xóa đệ quy
        }
    }
}