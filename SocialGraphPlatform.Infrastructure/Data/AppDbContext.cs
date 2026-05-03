using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        // ==================== DB SETS (CONTENT & SOCIAL) ====================
        public DbSet<Post> Posts { get; set; } = null!;
        public DbSet<PostMedia> PostMedias { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<Reaction> Reactions { get; set; } = null!;
        public DbSet<Story> Stories { get; set; } = null!;
        public DbSet<StoryView> StoryViews { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<Friendship> Friendships { get; set; } = null!;
        public DbSet<Block> Blocks { get; set; } = null!;
        public DbSet<SavedPost> SavedPosts { get; set; } = null!;
        public DbSet<Hashtag> Hashtags { get; set; } = null!;
        public DbSet<PostHashtag> PostHashtags { get; set; } = null!;
        public DbSet<PostReport> PostReports { get; set; } = null!;
        public DbSet<SavedPostCollection> SavedPostCollections { get; set; } = null!;

        // ==================== DB SETS (NOTIFICATION ADVANCED) ====================
        public DbSet<NotificationSettings> NotificationSettings => Set<NotificationSettings>();
        public DbSet<UserMute> UserMutes => Set<UserMute>();
        public DbSet<UserDevice> UserDevices => Set<UserDevice>();
        public DbSet<PushNotificationLog> PushNotificationLogs => Set<PushNotificationLog>();

        // ==================== DB SETS (AUTH & SESSION) ====================
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<UserSession> UserSessions { get; set; } = null!;

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==================== ÁP DỤNG CẤU HÌNH TỪ ASSEMBLY ====================
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // ==================== CẤU HÌNH BẢNG IDENTITY ====================
            modelBuilder.Entity<User>(entity => entity.ToTable("Users"));
            modelBuilder.Entity<IdentityRole<Guid>>(entity => entity.ToTable("Roles"));
            modelBuilder.Entity<IdentityUserRole<Guid>>(entity => entity.ToTable("UserRoles"));
            modelBuilder.Entity<IdentityUserClaim<Guid>>(entity => entity.ToTable("UserClaims"));
            modelBuilder.Entity<IdentityUserLogin<Guid>>(entity => entity.ToTable("UserLogins"));
            modelBuilder.Entity<IdentityRoleClaim<Guid>>(entity => entity.ToTable("RoleClaims"));
            modelBuilder.Entity<IdentityUserToken<Guid>>(entity => entity.ToTable("UserTokens"));

            // ==================== CẤU HÌNH USER SESSION ====================
            modelBuilder.Entity<UserSession>(entity =>
            {
                entity.ToTable("UserSessions");
                entity.HasIndex(e => e.TokenId).IsUnique();
                entity.HasIndex(e => e.UserId);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== CẤU HÌNH NOTIFICATION SETTINGS (1-1 với User) ====================
            modelBuilder.Entity<NotificationSettings>(entity =>
            {
                entity.ToTable("NotificationSettings");
                entity.HasIndex(e => e.UserId).IsUnique(); // 1-1
                entity.HasOne(e => e.User)
                      .WithOne()
                      .HasForeignKey<NotificationSettings>(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== CẤU HÌNH USER MUTE ====================
            modelBuilder.Entity<UserMute>(entity =>
            {
                entity.ToTable("UserMutes");
                // Mỗi cặp (UserId, MutedUserId) là duy nhất
                entity.HasIndex(e => new { e.UserId, e.MutedUserId }).IsUnique();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict); // Không cascade khi xóa User
                entity.HasOne(e => e.MutedUser)
                      .WithMany()
                      .HasForeignKey(e => e.MutedUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==================== CẤU HÌNH USER DEVICE ====================
            modelBuilder.Entity<UserDevice>(entity =>
            {
                entity.ToTable("UserDevices");
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.DeviceToken);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== CẤU HÌNH PUSH NOTIFICATION LOG ====================
            modelBuilder.Entity<PushNotificationLog>(entity =>
            {
                entity.ToTable("PushNotificationLogs");
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.NotificationId);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Notification)
                      .WithMany()
                      .HasForeignKey(e => e.NotificationId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==================== CHỈ MỤC HIỆU NĂNG CHO STORY ====================
            modelBuilder.Entity<Story>(entity =>
            {
                entity.HasIndex(s => new { s.UserId, s.ExpiresAt, s.IsDeleted })
                      .HasDatabaseName("IX_Stories_UserId_ExpiresAt_IsDeleted");
            });

            // ==================== CHỈ MỤC UNIQUE CHO STORY VIEW (chống trùng lặp) ====================
            modelBuilder.Entity<StoryView>(entity =>
            {
                entity.HasIndex(v => new { v.StoryId, v.ViewerId })
                      .IsUnique()
                      .HasDatabaseName("IX_StoryViews_StoryId_ViewerId");
            });

            // ==================== TẮT CASCADE DELETE MẶC ĐỊNH ====================
            foreach (var foreignKey in modelBuilder.Model.GetEntityTypes()
                .SelectMany(e => e.GetForeignKeys()))
            {
                // Chỉ giữ Cascade cho UserSession, còn lại Restrict để an toàn
                if (foreignKey.DeclaringEntityType.ClrType != typeof(UserSession))
                {
                    foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
                }
            }

            // ==================== GLOBAL QUERY FILTER (SOFT DELETE) ====================
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(AuditableEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                    var property = System.Linq.Expressions.Expression.Property(parameter, nameof(AuditableEntity.IsDeleted));
                    var filter = System.Linq.Expressions.Expression.Lambda(
                        System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false)),
                        parameter);

                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<AuditableEntity>().ToList();

            foreach (var entry in entries)
            {
                var now = DateTimeOffset.UtcNow;

                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Property(e => e.CreatedAt).CurrentValue = now;
                        entry.Property(e => e.IsDeleted).CurrentValue = false;
                        break;

                    case EntityState.Modified:
                        entry.Property(e => e.UpdatedAt).CurrentValue = now;
                        break;

                    case EntityState.Deleted:
                        entry.State = EntityState.Modified;
                        entry.Property(e => e.IsDeleted).CurrentValue = true;
                        entry.Property(e => e.UpdatedAt).CurrentValue = now;
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}