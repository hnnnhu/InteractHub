using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.SavedPost;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Services;

public class SavedPostService : ISavedPostService
{
    private readonly ISavedPostRepository _savedPostRepository;
    private readonly IPostRepository _postRepository;

    public SavedPostService(ISavedPostRepository savedPostRepository, IPostRepository postRepository)
    {
        _savedPostRepository = savedPostRepository;
        _postRepository = postRepository;
    }

    // ==========================================
    // 1. QUẢN LÝ BÀI VIẾT ĐÃ LƯU
    // ==========================================

    public async Task<ApiResponse> SavePostAsync(Guid userId, SavePostDto request)
    {
        if (!await _postRepository.ExistsActiveAsync(request.PostId))
            return ApiResponse.Fail("Bài viết không tồn tại hoặc đã bị xóa");

        string collectionName = string.IsNullOrWhiteSpace(request.CollectionName)
            ? "Mặc định"
            : request.CollectionName.Trim();

        var existingSavedPost = await _savedPostRepository.GetSavedPostIncludingDeletedAsync(userId, request.PostId);

        if (existingSavedPost != null)
        {
            if (!existingSavedPost.IsDeleted)
            {
                if (existingSavedPost.CollectionName.Equals(collectionName, StringComparison.OrdinalIgnoreCase))
                    return ApiResponse.Fail($"Bài viết này đã được lưu trong bộ sưu tập '{collectionName}'");

                existingSavedPost.UpdateCollection(collectionName, userId);
                await _savedPostRepository.SaveChangesAsync();
                return ApiResponse.Ok($"Đã chuyển bài viết sang bộ sưu tập '{collectionName}'");
            }
            else
            {
                existingSavedPost.SaveAgain(userId);
                existingSavedPost.UpdateCollection(collectionName, userId);
                await _savedPostRepository.SaveChangesAsync();
                return ApiResponse.Ok("Đã lưu bài viết vào bộ sưu tập");
            }
        }

        var savedPost = new SavedPost(userId, request.PostId, collectionName);

        await _savedPostRepository.AddAsync(savedPost);
        await _savedPostRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã lưu bài viết vào bộ sưu tập");
    }

    public async Task<ApiResponse> UnsavePostAsync(Guid userId, Guid postId)
    {
        var savedPost = await _savedPostRepository.GetSavedPostAsync(userId, postId);
        if (savedPost == null)
            return ApiResponse.NotFound("Bài viết này chưa được lưu");

        savedPost.Unsave(userId);
        await _savedPostRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã bỏ lưu bài viết");
    }

    public async Task<ApiResponse<PagedResult<SavedPostResponseDto>>> GetSavedPostsAsync(
        Guid userId, string? collectionName, int pageNumber, int pageSize)
    {
        var paged = await _savedPostRepository.GetSavedPostsAsync(userId, collectionName, pageNumber, pageSize);

        var dtos = paged.Items.Select(sp => new SavedPostResponseDto
        {
            Id = sp.Id,
            PostId = sp.PostId,
            UserId = sp.UserId,
            CollectionName = sp.CollectionName,
            PostContent = sp.Post?.Content ?? string.Empty,
            PostMediaUrl = sp.Post?.MediaItems?.OrderBy(m => m.SortOrder).FirstOrDefault()?.MediaUrl,
            PostCreatedAt = sp.Post?.CreatedAt ?? DateTime.MinValue,
            PostAuthorUserName = sp.Post?.User?.UserName ?? string.Empty,
            PostAuthorFullName = sp.Post?.User?.FullName ?? string.Empty,
            PostAuthorAvatarUrl = sp.Post?.User?.AvatarUrl,
            SavedAt = sp.CreatedAt,
            UpdatedAt = sp.UpdatedAt
        }).ToList();

        var result = new PagedResult<SavedPostResponseDto>(dtos, pageNumber, pageSize, paged.TotalCount);
        return ApiResponse<PagedResult<SavedPostResponseDto>>.Ok(result);
    }

    // ==========================================
    // 2. QUẢN LÝ BỘ SƯU TẬP (COLLECTION CRUD)
    // ==========================================

    public async Task<ApiResponse<List<CollectionDto>>> GetCollectionsAsync(Guid userId)
    {
        var collections = await _savedPostRepository.GetCollectionsAsync(userId);
        return ApiResponse<List<CollectionDto>>.Ok(collections);
    }

    public async Task<ApiResponse> CreateCollectionAsync(Guid userId, CreateCollectionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse.Fail("Tên bộ sưu tập không được để trống");

        string collectionName = request.Name.Trim();

        if (await _savedPostRepository.CollectionExistsAsync(userId, collectionName))
            return ApiResponse.Fail("Bộ sưu tập này đã tồn tại");

        // ĐÃ FIX: Gọi hàm tạo Collection vào DB thực tế
        // Lưu ý: Bạn cần đảm bảo _savedPostRepository có hàm này (hoặc Entity tương ứng)
        await _savedPostRepository.CreateUserCollectionAsync(userId, collectionName);
        await _savedPostRepository.SaveChangesAsync();

        return ApiResponse.Ok("Khởi tạo bộ sưu tập mới thành công");
    }

    public async Task<ApiResponse> UpdateCollectionAsync(Guid userId, string oldName, UpdateCollectionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.NewName))
            return ApiResponse.Fail("Tên bộ sưu tập mới không được để trống");

        if (oldName.Equals("Mặc định", StringComparison.OrdinalIgnoreCase))
            return ApiResponse.Fail("Không thể đổi tên bộ sưu tập hệ thống");

        string newName = request.NewName.Trim();

        // ĐÃ FIX: Kiểm tra Collection có tồn tại không (thay vì kiểm tra có bài viết không)
        if (!await _savedPostRepository.CollectionExistsAsync(userId, oldName))
            return ApiResponse.NotFound("Không tìm thấy bộ sưu tập cần cập nhật");

        // ĐÃ FIX: Cập nhật tên của chính bộ sưu tập rỗng đó trong DB
        await _savedPostRepository.UpdateUserCollectionNameAsync(userId, oldName, newName);

        // Sau đó mới cập nhật các bài viết bên trong (nếu có)
        var savedPosts = await _savedPostRepository.GetSavedPostsByCollectionAsync(userId, oldName);
        if (savedPosts.Any())
        {
            foreach (var post in savedPosts)
            {
                post.UpdateCollection(newName, userId);
            }
        }

        await _savedPostRepository.SaveChangesAsync();
        return ApiResponse.Ok($"Đã đổi tên bộ sưu tập thành '{newName}'");
    }

    public async Task<ApiResponse> DeleteCollectionAsync(Guid userId, string collectionName)
    {
        if (collectionName.Equals("Mặc định", StringComparison.OrdinalIgnoreCase))
            return ApiResponse.Fail("Không thể xóa bộ sưu tập hệ thống");

        // ĐÃ FIX: Kiểm tra Collection có tồn tại không
        if (!await _savedPostRepository.CollectionExistsAsync(userId, collectionName))
            return ApiResponse.NotFound("Bộ sưu tập không tồn tại");

        // ĐÃ FIX: Xóa chính bộ sưu tập đó trong CSDL (để dọn dẹp các bộ sưu tập rỗng)
        await _savedPostRepository.DeleteUserCollectionAsync(userId, collectionName);

        // Xử lý bài viết bên trong (nếu có)
        var savedPosts = await _savedPostRepository.GetSavedPostsByCollectionAsync(userId, collectionName);
        if (savedPosts.Any())
        {
            foreach (var post in savedPosts)
            {
                post.Unsave(userId);
            }
        }

        await _savedPostRepository.SaveChangesAsync();
        return ApiResponse.Ok($"Đã xóa bộ sưu tập '{collectionName}'");
    }
}