using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Friendship (Mối quan hệ kết bạn)
    /// Hỗ trợ trạng thái Pending, Accepted, Rejected.
    /// </summary>
    public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
    {
        public void Configure(EntityTypeBuilder<Friendship> builder)
        {
            builder.ToTable("Friendships");

            // ==================== KEY ====================
            builder.HasKey(f => f.Id);

            // ==================== PROPERTIES ====================
            builder.Property(f => f.RequesterId)
                   .IsRequired();

            builder.Property(f => f.AddresseeId)
                   .IsRequired();

            builder.Property(f => f.Status)
                   .HasConversion<string>()           // Lưu dạng string ("Pending", "Accepted"...) dễ debug
                   .IsRequired();

            // ==================== UNIQUE CONSTRAINT ====================
            // Ngăn chặn việc gửi lời mời kết bạn nhiều lần giữa cùng 2 người
            // Lưu ý: Nên thêm cả 2 chiều (A→B và B→A) nếu cần, nhưng hiện tại dùng 1 chiều là đủ
            builder.HasIndex(f => new { f.RequesterId, f.AddresseeId })
                   .IsUnique();

            // ==================== GLOBAL QUERY FILTER ====================
            builder.HasQueryFilter(f => !f.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(f => f.RequesterId);
            builder.HasIndex(f => f.AddresseeId);
            builder.HasIndex(f => f.Status);           // Hữu ích khi query lời mời đang chờ

            // ==================== RELATIONSHIPS ====================

            // Friendship (N) - Requester (1)
            builder.HasOne(f => f.Requester)
                   .WithMany(u => u.SentFriendRequests)           // Hoặc FriendshipsInitiated tùy theo tên trong User
                   .HasForeignKey(f => f.RequesterId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Friendship (N) - Addressee (1)
            builder.HasOne(f => f.Addressee)
                   .WithMany(u => u.ReceivedFriendRequests)       // Hoặc FriendshipsReceived
                   .HasForeignKey(f => f.AddresseeId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}