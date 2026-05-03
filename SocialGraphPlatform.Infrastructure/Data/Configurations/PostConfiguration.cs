using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình mapping cho thực thể Bài viết (Post) - Aggregate Root
    /// </summary>
    public class PostConfiguration : IEntityTypeConfiguration<Post>
    {
        public void Configure(EntityTypeBuilder<Post> builder)
        {
            builder.ToTable("Posts");

            // ==================== KEY ====================
            builder.HasKey(p => p.Id);

            // ==================== PROPERTIES ====================
            builder.Property(p => p.UserId)
                   .IsRequired();

            builder.Property(p => p.Content)
                   .HasMaxLength(10000)           // Cho phép nội dung dài
                   .IsRequired(false);            // Có thể chỉ có media không có content

            builder.Property(p => p.Privacy)
                   .HasConversion<string>()       // Lưu enum dưới dạng string (dễ đọc, dễ debug)
                   .IsRequired()
                   .HasDefaultValue(PrivacyLevel.Public)
                   .HasSentinel(PrivacyLevel.Public);

            // ==================== GLOBAL QUERY FILTER (Soft Delete) ====================
            builder.HasQueryFilter(p => !p.IsDeleted);

            // ==================== INDEXES ====================
            builder.HasIndex(p => p.UserId);
            builder.HasIndex(p => p.CreatedAt);
            builder.HasIndex(p => p.Privacy);

            // ==================== RELATIONSHIPS ====================

            // Post (N) - User (1)
            builder.HasOne(p => p.User)
                   .WithMany(u => u.Posts)
                   .HasForeignKey(p => p.UserId)
                   .OnDelete(DeleteBehavior.Restrict);   // Tránh Multiple Cascade Paths

            // Post (1) - PostMedia (N)
            builder.HasMany(p => p.MediaItems)
                   .WithOne(m => m.Post)
                   .HasForeignKey(m => m.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Post (1) - Comment (N)
            builder.HasMany(p => p.Comments)
                   .WithOne(c => c.Post)
                   .HasForeignKey(c => c.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Post (1) - Reaction (N)
            builder.HasMany(p => p.Reactions)
                   .WithOne(r => r.Post)
                   .HasForeignKey(r => r.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Post (1) - PostHashtag (N) - Junction Table
            builder.HasMany(p => p.PostHashtags)
                   .WithOne(ph => ph.Post)
                   .HasForeignKey(ph => ph.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Post (1) - SavedPost (N)
            builder.HasMany(p => p.SavedByUsers)
                   .WithOne(sp => sp.Post)
                   .HasForeignKey(sp => sp.PostId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Post (1) - PostReport (N)
            builder.HasMany(p => p.Reports)
                   .WithOne(pr => pr.Post)
                   .HasForeignKey(pr => pr.PostId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}