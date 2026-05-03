// SocialGraphPlatform.Application/Interfaces/IPostService.cs

using System;
using System.Threading.Tasks;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Post;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IPostService
{
    // ==========================================
    // 1. CƠ BẢN (CRUD)
    // ==========================================
    Task<ApiResponse<IdDto>> CreatePostAsync(Guid currentUserId, CreatePostDto request);
    Task<ApiResponse> UpdatePostAsync(Guid currentUserId, UpdatePostDto request);
    Task<ApiResponse> DeletePostAsync(Guid currentUserId, Guid postId);
    Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(Guid currentUserId, Guid postId);

    // ==========================================
    // 2. DANH SÁCH & PHÂN TRANG (FEEDS)
    // ==========================================
    // Lấy bảng tin (Newsfeed) bao gồm bài viết của mình và bạn bè
    Task<ApiResponse<PagedResult<PostSummaryDto>>> GetNewsFeedAsync(Guid currentUserId, int pageNumber, int pageSize);

    // Lấy danh sách bài viết trên tường của một người dùng cụ thể
    Task<ApiResponse<PagedResult<PostSummaryDto>>> GetUserPostsAsync(Guid currentUserId, Guid targetUserId, int pageNumber, int pageSize);

    // Tìm kiếm bài viết theo từ khóa
    Task<ApiResponse<PagedResult<PostSummaryDto>>> SearchPostsAsync(Guid currentUserId, string keyword, int pageNumber, int pageSize);

    // ==========================================
    // 3. TƯƠNG TÁC (REACTIONS)
    // ==========================================
    // (Giả sử bạn có file AddReactionDto chứa thuộc tính Type)
    Task<ApiResponse> AddOrUpdateReactionAsync(Guid currentUserId, Guid postId, int reactionType);
    Task<ApiResponse> RemoveReactionAsync(Guid currentUserId, Guid postId);
}