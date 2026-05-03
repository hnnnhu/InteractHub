using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Block (Chặn người dùng)
    /// Đảm bảo tính duy nhất của cặp Blocker - Blocked và hỗ trợ Soft Delete + Unblock.
    /// </summary>
    public class BlockConfiguration : IEntityTypeConfiguration<Block>
    {
        public void Configure(EntityTypeBuilder<Block> builder)
        {
            builder.ToTable("Blocks");

            // ==================== KEY ====================
            builder.HasKey(b => b.Id);

            // ==================== UNIQUE CONSTRAINT (RẤT QUAN TRỌNG) ====================
            // Đảm bảo một người không thể chặn cùng một người khác nhiều lần
            builder.HasIndex(b => new { b.BlockerId, b.BlockedId })
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(b => !b.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(b => b.BlockerId);     // Query: "Tôi đã chặn những ai?"
            builder.HasIndex(b => b.BlockedId);     // Query: "Ai đã chặn tôi?"

            // ==================== RELATIONSHIPS ====================

            // Block (N) → Blocker (1)
            builder.HasOne(b => b.Blocker)
                   .WithMany(u => u.BlocksInitiated)        // Hoặc BlocksSent tùy tên trong User
                   .HasForeignKey(b => b.BlockerId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Block (N) → Blocked (1)
            builder.HasOne(b => b.Blocked)
                   .WithMany(u => u.BlocksReceived)         // Hoặc BlockedByUsers
                   .HasForeignKey(b => b.BlockedId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}