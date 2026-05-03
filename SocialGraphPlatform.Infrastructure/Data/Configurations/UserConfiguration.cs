using Microsoft.EntityFrameworkCore; // Quan trọng nhất để có ToTable
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể User
    /// </summary>
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            // ==================== KEY ====================
            builder.HasKey(u => u.Id);

            // ==================== PROPERTIES ====================
            builder.Property(u => u.UserName)
                   .HasMaxLength(50)
                   .IsRequired();

            builder.Property(u => u.Email)
                   .HasMaxLength(255)
                   .IsRequired();

            builder.Property(u => u.FullName)           // ← Sửa từ DisplayName thành FullName (theo Entity của bạn)
                   .HasMaxLength(100)
                   .IsRequired();

            builder.Property(u => u.Bio)
                   .HasMaxLength(500);

            builder.Property(u => u.AvatarUrl)          // ← Sửa từ ProfilePictureUrl
                   .HasMaxLength(500);

            builder.Property(u => u.CoverPhotoUrl)
                   .HasMaxLength(500);

            builder.Property(u => u.PhoneNumber)
                   .HasMaxLength(20);

            // ==================== INDEXES ====================
            builder.HasIndex(u => u.UserName)
                   .IsUnique();

            builder.HasIndex(u => u.Email)
                   .IsUnique();

            // ==================== RELATIONSHIPS ====================

            builder.HasMany(u => u.Posts)
                   .WithOne(p => p.User)
                   .HasForeignKey(p => p.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Comments)
                   .WithOne(c => c.User)
                   .HasForeignKey(c => c.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Reactions)
                   .WithOne(r => r.User)
                   .HasForeignKey(r => r.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Stories)
                   .WithOne(s => s.User)
                   .HasForeignKey(s => s.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.SavedPosts)
                   .WithOne(sp => sp.User)
                   .HasForeignKey(sp => sp.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Friendship
            builder.HasMany(u => u.SentFriendRequests)
                   .WithOne(f => f.Requester)
                   .HasForeignKey(f => f.RequesterId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.ReceivedFriendRequests)
                   .WithOne(f => f.Addressee)
                   .HasForeignKey(f => f.AddresseeId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Block
            builder.HasMany(u => u.BlocksInitiated)
                   .WithOne(b => b.Blocker)
                   .HasForeignKey(b => b.BlockerId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.BlocksReceived)
                   .WithOne(b => b.Blocked)
                   .HasForeignKey(b => b.BlockedId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Notification
            builder.HasMany(u => u.NotificationsReceived)
                   .WithOne(n => n.Receiver)
                   .HasForeignKey(n => n.ReceiverId)
                   .OnDelete(DeleteBehavior.Restrict);

            // PostReport
            builder.HasMany(u => u.PostReports)           // Giả sử bạn có ICollection<PostReport> PostReports trong User
                   .WithOne(pr => pr.Reporter)
                   .HasForeignKey(pr => pr.ReporterId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}