using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.SavedPost;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface ISavedPostRepository : IGenericRepository<SavedPost>
{
    // ==========================================
    // 1. CÁC HÀM TƯƠNG TÁC VỚI BÀI VIẾT ĐÃ LƯU
    // ==========================================

    /// <summary>
    /// Kiểm tra bài viết đã được lưu vào bộ sưu tập cụ thể của người dùng chưa
    /// </summary>
    Task<bool> IsPostSavedAsync(Guid userId, Guid postId, string? collectionName = null);

    /// <summary>
    /// Lấy bản ghi lưu bài viết cụ thể (Chỉ lấy các bản ghi đang active, chưa bị xóa)
    /// </summary>
    Task<SavedPost?> GetSavedPostAsync(Guid userId, Guid postId);

    /// <summary>
    /// [BỔ SUNG]: Lấy bản ghi lưu bài viết bao gồm cả những bản ghi đã bị xóa mềm (Soft Delete).
    /// Phục vụ cho việc khôi phục bản ghi (Restore) thay vì tạo mới để tránh lỗi vi phạm Unique Index.
    /// </summary>
    Task<SavedPost?> GetSavedPostIncludingDeletedAsync(Guid userId, Guid postId);

    /// <summary>
    /// Lấy danh sách bài viết đã lưu có phân trang (lọc theo collection nếu cần)
    /// </summary>
    Task<PagedResult<SavedPost>> GetSavedPostsAsync(Guid userId, string? collectionName, int pageNumber, int pageSize);

    /// <summary>
    /// Lấy tất cả các bản ghi SavedPost thuộc về một bộ sưu tập cụ thể 
    /// phục vụ cho việc cập nhật tên hoặc xóa hàng loạt bài viết bên trong.
    /// </summary>
    Task<List<SavedPost>> GetSavedPostsByCollectionAsync(Guid userId, string collectionName);


    // ==========================================
    // 2. CÁC HÀM QUẢN LÝ ĐỘC LẬP BỘ SƯU TẬP (COLLECTION)
    // ==========================================

    /// <summary>
    /// Lấy danh sách các tên bộ sưu tập và số lượng bài viết bên trong của người dùng
    /// </summary>
    Task<List<CollectionDto>> GetCollectionsAsync(Guid userId);

    /// <summary>
    /// Kiểm tra bộ sưu tập có tồn tại hay không (Dựa trên bảng Collection độc lập)
    /// </summary>
    Task<bool> CollectionExistsAsync(Guid userId, string collectionName);

    /// <summary>
    /// [MỚI THÊM]: Tạo một bộ sưu tập mới hoàn toàn (có thể rỗng) trong CSDL
    /// </summary>
    Task CreateUserCollectionAsync(Guid userId, string collectionName);

    /// <summary>
    /// [MỚI THÊM]: Cập nhật tên của một bộ sưu tập trong CSDL
    /// </summary>
    Task UpdateUserCollectionNameAsync(Guid userId, string oldName, string newName);

    /// <summary>
    /// [MỚI THÊM]: Xóa cứng bộ sưu tập khỏi CSDL (các bài viết bên trong đã được xử lý ở Service)
    /// </summary>
    Task DeleteUserCollectionAsync(Guid userId, string collectionName);
}