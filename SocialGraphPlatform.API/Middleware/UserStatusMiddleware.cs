using Microsoft.AspNetCore.Identity;
using SocialGraphPlatform.API.Extensions;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Application.DTOs.Common;
using System.Net;
using System.Text.Json;
using System.Security.Claims;

namespace SocialGraphPlatform.API.Middleware;

public class UserStatusMiddleware
{
    private readonly RequestDelegate _next;

    // Tối ưu hiệu năng: Tái sử dụng JsonSerializerOptions thay vì khởi tạo mới mỗi Request
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public UserStatusMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // LƯU Ý: Đã gỡ bỏ IUserSessionService khỏi đây để bỏ qua kiểm tra Session
    public async Task InvokeAsync(HttpContext context, UserManager<User> userManager)
    {
        // Chỉ kiểm tra nếu request đã vượt qua bước xác thực JWT (có Token hợp lệ về mặt chữ ký)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.GetUserId();

            // 1. KIỂM TRA TRẠNG THÁI TÀI KHOẢN (Bị khóa / Bị xóa)
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.IsDeleted || (user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow))
            {
                await WriteUnauthorizedResponseAsync(context, "Tài khoản của bạn đã bị khóa hoặc không tồn tại trên hệ thống.");
                return;
            }

            // Đã lược bỏ toàn bộ Step 2 (Kiểm tra hợp lệ Session/JTI) 
            // và Step 3 (Cập nhật Last Active) theo yêu cầu.
        }

        // Nếu mọi thứ ổn, cho phép request đi tiếp vào Controller
        await _next(context);
    }

    /// <summary>
    /// Hàm helper để trả về lỗi 401 Unauthorized theo chuẩn JSON
    /// </summary>
    private static async Task WriteUnauthorizedResponseAsync(HttpContext context, string errorMessage)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
        context.Response.ContentType = "application/json";

        var response = ApiResponse.Fail(errorMessage);
        var json = JsonSerializer.Serialize(response, _jsonOptions);

        await context.Response.WriteAsync(json);
    }
}