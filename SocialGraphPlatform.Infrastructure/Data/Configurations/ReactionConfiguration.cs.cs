using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho Reaction (Cảm xúc Like, Love, Haha, Wow, Sad, Angry...)
    /// Đảm bảo 1 user chỉ được reaction 1 lần trên 1 post.
    /// </summary>
    public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
    {
        public void Configure(EntityTypeBuilder<Reaction> builder)
        {
            builder.ToTable("Reactions");

            // ==================== KEY ====================
            builder.HasKey(r => r.Id);

            // ==================== PROPERTIES ====================
            builder.Property(r => r.PostId)
                   .IsRequired();

            builder.Property(r => r.UserId)
                   .IsRequired();

            builder.Property(r => r.Type)
                   .HasConversion<string>()        // Lưu dạng string dễ debug và migrate
                   .IsRequired();

            // ==================== UNIQUE CONSTRAINT (RẤT QUAN TRỌNG) ====================
            // Bảo vệ nghiệp vụ: 1 user chỉ có tối đa 1 reaction trên 1 post
            builder.HasIndex(r => new { r.PostId, r.UserId })
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(r => !r.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(r => r.PostId);      // Tăng tốc khi đếm reaction của bài viết
            builder.HasIndex(r => r.UserId);      // Tăng tốc khi xem lịch sử reaction của user

            // ==================== RELATIONSHIPS ====================

            // Reaction (N) → Post (1)
            builder.HasOne(r => r.Post)
                   .WithMany(p => p.Reactions)
                   .HasForeignKey(r => r.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Reaction (N) → User (1)
            builder.HasOne(r => r.User)
                   .WithMany(u => u.Reactions)
                   .HasForeignKey(r => r.UserId)
                   .OnDelete(DeleteBehavior.Restrict);   // Tránh Multiple Cascade Paths
        }
    }
}