using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SocialGraphPlatform.Infrastructure.Data.Seeders;

public static class RoleSeeder
{
    // Danh sách tất cả roles trong hệ thống
    public static readonly string[] Roles = ["User", "Admin"] ;

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var logger = serviceProvider.GetRequiredService<ILogger<RoleManager<IdentityRole<Guid>>>>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                if (result.Succeeded)
                    logger.LogInformation("Role '{Role}' đã được tạo thành công.", role);
                else
                    logger.LogError("Không thể tạo role '{Role}': {Errors}",
                        role, string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}