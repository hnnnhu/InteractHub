// SocialGraphPlatform.Infrastructure/Data/Configurations/RefreshTokenConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        // Primary Key
        builder.HasKey(rt => rt.Id);

        // Properties
        builder.Property(rt => rt.Token)
               .IsRequired()
               .HasMaxLength(500);

        builder.Property(rt => rt.UserId)
               .IsRequired();

        builder.Property(rt => rt.ExpiresAt)
               .IsRequired();

        builder.Property(rt => rt.IsRevoked)
               .IsRequired()
               .HasDefaultValue(false);

        builder.Property(rt => rt.CreatedAt)
               .IsRequired()
               .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(rt => rt.RevokedAt)
               .IsRequired(false);

        builder.Property(rt => rt.CreatedByIp)
               .HasMaxLength(50);

        builder.Property(rt => rt.UserAgent)
               .HasMaxLength(500);

        builder.Property(rt => rt.DeviceId)
               .HasMaxLength(100);

        // Indexes
        builder.HasIndex(rt => rt.Token)
               .IsUnique();

        builder.HasIndex(rt => rt.UserId);

        builder.HasIndex(rt => rt.ExpiresAt);

        builder.HasIndex(rt => new { rt.UserId, rt.IsRevoked, rt.ExpiresAt })
               .HasDatabaseName("IX_RefreshTokens_UserId_Active");

        // Relationship
        builder.HasOne(rt => rt.User)
               .WithMany()
               .HasForeignKey(rt => rt.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}