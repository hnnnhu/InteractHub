// SocialGraphPlatform.Infrastructure/Data/DbInitializer.cs

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace SocialGraphPlatform.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var logger = serviceProvider.GetRequiredService<ILoggerFactory>()
                                        .CreateLogger(nameof(DbInitializer));

            try
            {
                // ====================== MIGRATION ======================
                await ApplyMigrationsAsync(context, logger);

                // Seed Roles
                await SeedRolesAsync(roleManager, logger);

                await context.SaveChangesAsync();
                logger.LogInformation("✅ DbInitializer completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Lỗi khi migration hoặc seed database.");
                throw;
            }
        }

        /// <summary>
        /// Áp dụng migration một cách an toàn (tự tạo migration nếu có pending changes)
        /// </summary>
        private static async Task ApplyMigrationsAsync(AppDbContext context, ILogger logger)
        {
            // Kiểm tra có pending migration không
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();

            if (pendingMigrations.Any())
            {
                logger.LogWarning("Detected {Count} pending migrations. Applying...", pendingMigrations.Count());

                // Áp dụng migration
                await context.Database.MigrateAsync();
                logger.LogInformation("✅ All pending migrations applied successfully.");
            }
            else
            {
                logger.LogInformation("Database is up to date. No migration needed.");
            }
        }

        private static async Task SeedRolesAsync(
            RoleManager<IdentityRole<Guid>> roleManager,
            ILogger logger)
        {
            string[] roleNames = { "User", "Admin" };

            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));

                    if (result.Succeeded)
                        logger.LogInformation("Role '{Role}' đã được tạo thành công.", roleName);
                    else
                        logger.LogError("Không thể tạo role '{Role}': {Errors}",
                            roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
                else
                {
                    logger.LogDebug("Role '{Role}' đã tồn tại.", roleName);
                }
            }
        }

        /// <summary>
        /// Gán Role "User" tự động khi đăng ký mới
        /// </summary>
        public static async Task AssignDefaultUserRoleAsync(
            UserManager<User> userManager,
            User user)
        {
            if (user != null && !await userManager.IsInRoleAsync(user, "User"))
            {
                var result = await userManager.AddToRoleAsync(user, "User");

                if (!result.Succeeded)
                {
                    throw new Exception($"Không thể gán role User cho tài khoản {user.UserName}: " +
                        $"{string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }
    }
}