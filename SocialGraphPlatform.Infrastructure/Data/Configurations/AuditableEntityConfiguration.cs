using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Cấu hình dùng chung cho tất cả các thực thể kế thừa AuditableEntity
    /// (Bao gồm CreatedAt, UpdatedAt, Soft Delete, CreatedBy, UpdatedBy, DeletedBy...)
    /// </summary>
    public abstract class AuditableEntityConfiguration<TEntity> : IEntityTypeConfiguration<TEntity>
        where TEntity : AuditableEntity
    {
        public virtual void Configure(EntityTypeBuilder<TEntity> builder)
        {
            // ==================== COMMON PROPERTIES ====================

            builder.Property(e => e.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("GETUTCDATE()");   // Tự động lấy thời gian UTC khi insert

            builder.Property(e => e.UpdatedAt)
                   .IsRequired(false);

            builder.Property(e => e.DeletedAt)
                   .IsRequired(false);

            builder.Property(e => e.CreatedBy)
                   .IsRequired();

            builder.Property(e => e.UpdatedBy)
                   .IsRequired(false);

            builder.Property(e => e.DeletedBy)
                   .IsRequired(false);

            builder.Property(e => e.IsDeleted)
                   .IsRequired()
                   .HasDefaultValue(false);

            // ==================== GLOBAL QUERY FILTER (RẤT QUAN TRỌNG) ====================
            // Tự động áp dụng cho mọi query SELECT của tất cả entity kế thừa AuditableEntity
            builder.HasQueryFilter(e => !e.IsDeleted);

            // ==================== INDEXES (Tối ưu hiệu năng) ====================
            builder.HasIndex(e => e.IsDeleted);      // Hỗ trợ query có/không soft delete
            builder.HasIndex(e => e.CreatedAt);      // Thường dùng để sắp xếp mới nhất
            builder.HasIndex(e => e.CreatedBy);      // Thống kê ai tạo nhiều nội dung
        }
    }
}