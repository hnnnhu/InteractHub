using Microsoft.AspNetCore.Http;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.DTOs.Users;
using static SocialGraphPlatform.Application.DTOs.User.UserSummaryDto;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IUserService
{
    // Lấy profile của một user (Cần currentUserId để tính toán xem 2 người có đang là bạn bè không và check quyền riêng tư)
    Task<ApiResponse<UserProfileDto>> GetUserProfileAsync(Guid currentUserId, Guid targetUserId);

    Task<ApiResponse<UserProfileDto>> GetUserProfileByUsernameAsync(Guid currentUserId, string username);

    // Cập nhật thông tin cá nhân
    Task<ApiResponse> UpdateProfileAsync(Guid currentUserId, UpdateProfileDto request);

    // Đổi mật khẩu
    Task<ApiResponse> ChangePasswordAsync(Guid currentUserId, ChangePasswordDto request);

    // Tìm kiếm người dùng (Có phân trang)
    // Cần currentUserId để biết trạng thái kết bạn của người đang tìm kiếm với các kết quả
    Task<ApiResponse<PagedResult<UserSummaryDto>>> SearchUsersAsync(Guid currentUserId, UserSearchDto request);

    // Lấy thống kê nhanh của User (Đã thêm currentUserId để kiểm tra quyền riêng tư)
    Task<ApiResponse<UserStatsDto>> GetUserStatsAsync(Guid currentUserId, Guid targetUserId);

    // Xóa tài khoản (soft delete) – Người dùng tự vô hiệu hóa
    Task<ApiResponse> DeactivateAccountAsync(Guid currentUserId);

    // Khôi phục tài khoản (trong vòng 30 ngày sau khi xóa)
    Task<ApiResponse> RestoreAccountAsync(Guid currentUserId);

    // --- 2FA (Two-Factor Authentication) ---

    // 1. Lấy mã QR / Secret Key
    Task<ApiResponse<TwoFactorSetupDto>> GetTwoFactorSetupAsync(Guid currentUserId);

    // 2. Xác minh mã và Bật 2FA (Trả về danh sách Recovery Codes)
    Task<ApiResponse<IEnumerable<string>>> EnableTwoFactorAsync(Guid currentUserId, VerifyTwoFactorDto request);

    // 3. Vô hiệu hóa 2FA
    Task<ApiResponse> DisableTwoFactorAsync(Guid currentUserId, VerifyTwoFactorDto request);

    // 4. Tạo mới Recovery Codes (khi người dùng làm mất hoặc đã dùng hết)
    Task<ApiResponse<IEnumerable<string>>> GenerateTwoFactorRecoveryCodesAsync(Guid currentUserId);

    // --- UPLOAD HÌNH ẢNH (AVATAR & COVER) ---

    // Upload và cập nhật ảnh đại diện
    Task<ApiResponse> UpdateAvatarAsync(Guid currentUserId, IFormFile file);

    // Upload và cập nhật ảnh bìa
    Task<ApiResponse> UpdateCoverPhotoAsync(Guid currentUserId, IFormFile file);

    // --- QUYỀN RIÊNG TƯ ---

    // Cập nhật cài đặt hiển thị trang cá nhân
    Task<ApiResponse> UpdatePrivacySettingsAsync(Guid currentUserId, UpdatePrivacyDto request);
}