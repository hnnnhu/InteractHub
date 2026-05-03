using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.SavedPost;

namespace SocialGraphPlatform.Application.Interfaces;

public interface ISavedPostService
{
    // --- QUẢN LÝ BÀI VIẾT ĐÃ LƯU ---
    // Lưu bài viết vào một bộ sưu tập (mặc định hoặc tùy chọn)
    Task<ApiResponse> SavePostAsync(Guid userId, SavePostDto request);

    // Bỏ lưu bài viết
    Task<ApiResponse> UnsavePostAsync(Guid userId, Guid postId);

    // Lấy danh sách bài viết đã lưu, có thể lọc theo tên bộ sưu tập
    Task<ApiResponse<PagedResult<SavedPostResponseDto>>> GetSavedPostsAsync(Guid userId, string? collectionName, int pageNumber, int pageSize);

    // --- QUẢN LÝ BỘ SƯU TẬP ---
    // Lấy danh sách các bộ sưu tập của người dùng
    Task<ApiResponse<List<CollectionDto>>> GetCollectionsAsync(Guid userId);

    // Tạo bộ sưu tập mới
    Task<ApiResponse> CreateCollectionAsync(Guid userId, CreateCollectionDto request);

    // Cập nhật tên bộ sưu tập
    Task<ApiResponse> UpdateCollectionAsync(Guid userId, string oldName, UpdateCollectionDto request);

    // Xóa bộ sưu tập (các bài viết bên trong thường được chuyển về bộ sưu tập "Mặc định" hoặc xóa tùy logic)
    Task<ApiResponse> DeleteCollectionAsync(Guid userId, string collectionName);
}