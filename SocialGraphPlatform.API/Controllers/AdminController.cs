using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.API.Controllers;

[Route("api/admin")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly IReportRepository _reportRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IReactionRepository _reactionRepository;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public AdminController(
        IUserRepository userRepository,
        IPostRepository postRepository,
        IReportRepository reportRepository,
        ICommentRepository commentRepository,
        IReactionRepository reactionRepository,
        UserManager<User> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _reportRepository = reportRepository;
        _commentRepository = commentRepository;
        _reactionRepository = reactionRepository;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId))
            return userId;
        throw new UnauthorizedAccessException("Không thể xác thực danh tính admin.");
    }

    #region 1. Dashboard thống kê

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var usersCount = await _userManager.Users.CountAsync(u => !u.IsDeleted);
        var postsCount = await _postRepository.CountAsync(p => !p.IsDeleted);
        var commentsCount = await _commentRepository.CountAsync(c => !c.IsDeleted);
        var reactionsCount = await _reactionRepository.CountAsync(r => !r.IsDeleted);
        var reportsPending = await _reportRepository.CountAsync(r => r.Status == ReportStatus.Pending && !r.IsDeleted);

        var data = new
        {
            TotalUsers = usersCount,
            TotalPosts = postsCount,
            TotalComments = commentsCount,
            TotalReactions = reactionsCount,
            PendingReports = reportsPending
        };

        return Ok(ApiResponse<object>.Ok(data, "Thống kê hệ thống"));
    }

    #endregion

    #region 2. Quản lý người dùng

    /// <summary>
    /// Danh sách người dùng (có đầy đủ email, ngày tạo, trạng thái).
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? keyword, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        var query = _userManager.Users
            .Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(kw) ||
                u.UserName.ToLower().Contains(kw) ||
                u.Email.ToLower().Contains(kw));
        }

        query = query.OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync();

        var users = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Lấy trạng thái khóa của từng user (lockout)
        var dtos = new List<object>();
        foreach (var user in users)
        {
            var isBanned = await _userManager.IsLockedOutAsync(user);
            var status = user.IsDeleted ? "Deleted" :
                         isBanned ? "Banned" : "Active";

            dtos.Add(new
            {
                user.Id,
                user.UserName,
                user.FullName,
                AvatarUrl = user.AvatarUrl,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Status = status,
                // Thống kê bổ sung (có thể bổ sung sau)
                FollowerCount = 0,
                PostCount = 0,
                // Các trường cũ để tương thích
                IsFriend = false,
                FriendshipStatus = (int?)null,
                IsCloseFriend = false
            });
        }

        var result = new PagedResult<object>(dtos, pageNumber, pageSize, totalCount);
        return Ok(ApiResponse<PagedResult<object>>.Ok(result));
    }

    /// <summary>
    /// Chi tiết người dùng (đầy đủ thông tin cho trang chi tiết).
    /// </summary>
    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted)
            return NotFound(ApiResponse.NotFound("Không tìm thấy người dùng."));

        var roles = await _userManager.GetRolesAsync(user);
        var isBanned = await _userManager.IsLockedOutAsync(user);

        var detail = new
        {
            user.Id,
            user.UserName,
            user.FullName,
            user.Email,
            user.AvatarUrl,
            user.Bio,
            ProfileVisibility = user.ProfileVisibility.ToString(),
            CreatedAt = user.CreatedAt,
            IsDeleted = user.IsDeleted,
            IsBanned = isBanned,
            Roles = roles.ToList(),
            // Thống kê (tạm thời để 0, sẽ cập nhật sau)
            FollowerCount = 0,
            PostCount = 0,
            StoryCount = 0
        };

        return Ok(ApiResponse<object>.Ok(detail, "Chi tiết người dùng"));
    }

    [HttpPost("users/{userId:guid}/ban")]
    public async Task<IActionResult> BanUser(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse.NotFound("Người dùng không tồn tại."));

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

        return Ok(ApiResponse.Ok("Đã khóa tài khoản thành công."));
    }

    [HttpPost("users/{userId:guid}/unban")]
    public async Task<IActionResult> UnbanUser(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse.NotFound("Người dùng không tồn tại."));

        if (await _userManager.IsLockedOutAsync(user))
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
        }

        return Ok(ApiResponse.Ok("Đã mở khóa tài khoản thành công."));
    }

    [HttpPost("users/{userId:guid}/roles")]
    public async Task<IActionResult> AddRole(Guid userId, [FromBody] string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return BadRequest(ApiResponse.Fail("Tên vai trò không được để trống."));

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse.NotFound("Người dùng không tồn tại."));

        if (!await _roleManager.RoleExistsAsync(roleName))
            return BadRequest(ApiResponse.Fail($"Vai trò '{roleName}' không tồn tại."));

        var result = await _userManager.AddToRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse.Fail("Thêm vai trò thất bại.", errors));
        }

        return Ok(ApiResponse.Ok($"Đã thêm vai trò '{roleName}' cho người dùng."));
    }

    [HttpDelete("users/{userId:guid}/roles/{roleName}")]
    public async Task<IActionResult> RemoveRole(Guid userId, string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return BadRequest(ApiResponse.Fail("Tên vai trò không được để trống."));

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse.NotFound("Người dùng không tồn tại."));

        if (userId == GetCurrentUserId() && roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse.Fail("Bạn không thể tự gỡ quyền Admin của chính mình."));

        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse.Fail("Gỡ vai trò thất bại.", errors));
        }

        return Ok(ApiResponse.Ok($"Đã gỡ vai trò '{roleName}' khỏi người dùng."));
    }

    #endregion

    #region 3. Quản lý bài viết

    [HttpGet("posts")]
    public async Task<IActionResult> GetAllPosts([FromQuery] string? keyword, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        var query = _postRepository.Queryable()
            .Include(p => p.User)
            .Where(p => !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.ToLower();
            query = query.Where(p => p.Content != null && p.Content.ToLower().Contains(kw));
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = posts.Select(p => new
        {
            p.Id,
            p.UserId,
            AuthorName = p.User?.FullName ?? "Không xác định",
            p.Content,
            Privacy = p.Privacy.ToString(),
            p.CreatedAt,
            IsDeleted = p.IsDeleted,
            FirstMediaUrl = (string?)null,  // sẽ bổ sung khi có media
            LikeCount = 0,
            CommentCount = 0,
            ShareCount = 0
        }).ToList();

        var result = new PagedResult<object>(dtos.Cast<object>().ToList(), pageNumber, pageSize, totalCount);
        return Ok(ApiResponse<PagedResult<object>>.Ok(result));
    }

    [HttpDelete("posts/{postId:guid}")]
    public async Task<IActionResult> DeletePost(Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
            return NotFound(ApiResponse.NotFound("Bài viết không tồn tại."));

        post.SoftDelete(GetCurrentUserId());
        await _postRepository.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Đã xóa bài viết thành công."));
    }

    #endregion
}