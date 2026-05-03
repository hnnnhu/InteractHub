// SocialGraphPlatform.Api/Controllers/BlocksController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/blocks")] // Sử dụng route cố định để tránh gãy API khi refactor tên Controller
[ApiController]
[Authorize] // 🔒 Yêu cầu xác thực JWT cho toàn bộ các thao tác chặn
public class BlocksController : ControllerBase
{
    private readonly IBlockService _blockService;

    public BlocksController(IBlockService blockService)
    {
        _blockService = blockService;
    }

    /// <summary>
    /// Helper: Trích xuất UserId an toàn từ Claims trong JWT Token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId))
            return userId;

        throw new UnauthorizedAccessException("Không thể xác định danh tính người dùng.");
    }

    // =========================================================
    // 1. THAO TÁC CHẶN/GỠ CHẶN (COMMANDS)
    // =========================================================

    /// <summary>
    /// Chặn một người dùng khác
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BlockUser([FromBody] BlockUserDto request)
    {
        var currentUserId = GetCurrentUserId();

        // Validate cơ bản ở tầng API trước khi đẩy xuống Service
        if (currentUserId == request.BlockedId)
            return BadRequest(ApiResponse.Fail("Bạn không thể thực hiện hành động chặn chính mình."));

        var response = await _blockService.BlockUserAsync(currentUserId, request);

        if (!response.IsSuccess)
            return BadRequest(response);

        return Ok(response);
    }

    /// <summary>
    /// Gỡ bỏ lệnh chặn đối với một người dùng
    /// </summary>
    [HttpDelete("{blockedId}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnblockUser(Guid blockedId)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _blockService.UnblockUserAsync(currentUserId, blockedId);

        if (!response.IsSuccess)
            return BadRequest(response);

        return Ok(response);
    }

    // =========================================================
    // 2. TRUY VẤN TRẠNG THÁI & DANH SÁCH (QUERIES)
    // =========================================================

    /// <summary>
    /// Xem danh sách những người dùng mà bạn đang chặn (Có hỗ trợ tìm kiếm và sắp xếp)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<BlockedUserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBlockedUsers(
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();

        // Truyền các tham số tìm kiếm/sắp xếp xuống Service
        var response = await _blockService.GetBlockedUsersAsync(
            currentUserId, search, sortBy, sortDirection, pageNumber, pageSize);

        return Ok(response);
    }

    /// <summary>
    /// Kiểm tra trạng thái chặn 2 chiều giữa bạn và một người dùng khác
    /// </summary>
    [HttpGet("{targetUserId}/status")]
    [ProducesResponseType(typeof(ApiResponse<BlockStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBlockStatus(Guid targetUserId)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _blockService.GetBlockStatusAsync(currentUserId, targetUserId);

        return Ok(response);
    }
}