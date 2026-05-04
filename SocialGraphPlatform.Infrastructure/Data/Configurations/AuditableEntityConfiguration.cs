using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations
{
    public abstract class AuditableEntityConfiguration<TEntity> : IEntityTypeConfiguration<TEntity>
        where TEntity : AuditableEntity
    {
        public virtual void Configure(EntityTypeBuilder<TEntity> builder)
        {
            builder.Property(e => e.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("NOW()");

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

            builder.HasQueryFilter(e => !e.IsDeleted);

            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.CreatedAt);
            builder.HasIndex(e => e.CreatedBy);
        }
    }
}