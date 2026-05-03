using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.DTOs.Users;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using System.Text.Encodings.Web;
using static SocialGraphPlatform.Application.DTOs.User.UserSummaryDto;

namespace SocialGraphPlatform.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IBlockRepository _blockRepository;
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly UserManager<User> _userManager;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUserSessionService _sessionService; // ⬅️ Thêm Session Service

    public UserService(
        IUserRepository userRepository,
        IBlockRepository blockRepository,
        IFriendshipRepository friendshipRepository,
        UserManager<User> userManager,
        IFileStorageService fileStorageService,
        IUserSessionService sessionService) // ⬅️ Inject vào Constructor
    {
        _userRepository = userRepository;
        _blockRepository = blockRepository;
        _friendshipRepository = friendshipRepository;
        _userManager = userManager;
        _fileStorageService = fileStorageService;
        _sessionService = sessionService;
    }

    public async Task<ApiResponse<UserProfileDto>> GetUserProfileAsync(Guid currentUserId, Guid targetUserId)
    {
        // 1. Lấy thông tin cơ bản của User
        var user = await _userRepository.GetUserWithDetailsAsync(targetUserId);
        if (user == null)
            return ApiResponse<UserProfileDto>.NotFound("Không tìm thấy người dùng.");

        // 2. Xử lý Block: Bảo mật tuyệt đối
        var isBlocked = await _blockRepository.IsBlockedAsync(currentUserId, targetUserId);
        if (isBlocked)
        {
            return ApiResponse<UserProfileDto>.NotFound("Người dùng không tồn tại hoặc nội dung không khả dụng.");
        }

        // 3. Lấy thông tin quan hệ bạn bè
        var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, targetUserId);
        bool isFriend = friendship?.Status == FriendshipStatus.Accepted;

        // 4. Kiểm tra quyền riêng tư (Privacy Check)
        bool isSelf = currentUserId == targetUserId;
        bool canViewDetails = isSelf;

        if (!isSelf)
        {
            switch (user.ProfileVisibility)
            {
                case PrivacyLevel.Public:
                    canViewDetails = true;
                    break;
                case PrivacyLevel.FriendsOnly:
                case PrivacyLevel.CloseFriends:
                    canViewDetails = isFriend;
                    break;
                case PrivacyLevel.Private:
                    canViewDetails = false;
                    break;
            }
        }

        // 5. Mapping sang DTO với logic ẩn dữ liệu nhạy cảm
        var dto = new UserProfileDto
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,

            Bio = canViewDetails ? user.Bio : null,
            CoverPhotoUrl = canViewDetails ? user.CoverPhotoUrl : null,
            DateOfBirth = canViewDetails ? user.DateOfBirth : null,

            PostCount = canViewDetails ? (user.Posts?.Count(p => !p.IsDeleted) ?? 0) : 0,
            FriendCount = canViewDetails ? await _friendshipRepository.GetFriendCountAsync(targetUserId) : 0,
            StoryCount = canViewDetails ? (user.Stories?.Count(s => !s.IsDeleted) ?? 0) : 0,

            IsFriend = isFriend,
            IsBlocked = false,
            FriendshipStatus = friendship?.Status,
            IsPrivateProfileView = !canViewDetails,
            ProfileVisibility = user.ProfileVisibility
        };

        return ApiResponse<UserProfileDto>.Ok(dto);
    }

    public async Task<ApiResponse<UserStatsDto>> GetUserStatsAsync(Guid currentUserId, Guid targetUserId)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId);
        if (user == null || user.IsDeleted)
            return ApiResponse<UserStatsDto>.NotFound("Không tìm thấy người dùng.");

        var isBlocked = await _blockRepository.IsBlockedAsync(currentUserId, targetUserId);
        if (isBlocked)
            return ApiResponse<UserStatsDto>.NotFound("Nội dung không khả dụng.");

        bool isSelf = currentUserId == targetUserId;
        bool canViewDetails = isSelf;

        if (!isSelf)
        {
            var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, targetUserId);
            bool isFriend = friendship?.Status == FriendshipStatus.Accepted;

            switch (user.ProfileVisibility)
            {
                case PrivacyLevel.Public: canViewDetails = true; break;
                case PrivacyLevel.FriendsOnly:
                case PrivacyLevel.CloseFriends: canViewDetails = isFriend; break;
                case PrivacyLevel.Private: canViewDetails = false; break;
            }
        }

        if (!canViewDetails)
        {
            return ApiResponse<UserStatsDto>.Ok(new UserStatsDto { PostCount = 0, FriendCount = 0, StoryCount = 0, SavedPostCount = 0 });
        }

        var stats = await _userRepository.GetUserStatsAsync(targetUserId);

        if (!isSelf)
        {
            stats = stats with { SavedPostCount = 0 };
        }

        return ApiResponse<UserStatsDto>.Ok(stats);
    }

    public async Task<ApiResponse<UserProfileDto>> GetUserProfileByUsernameAsync(Guid currentUserId, string username)
    {
        var user = await _userRepository.GetUserByUsernameAsync(username);
        if (user == null) return ApiResponse<UserProfileDto>.NotFound("Không tìm thấy người dùng");
        return await GetUserProfileAsync(currentUserId, user.Id);
    }

    public async Task<ApiResponse> UpdateProfileAsync(Guid currentUserId, UpdateProfileDto request)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null) return ApiResponse.NotFound("Không tìm thấy người dùng");

        user.UpdateProfile(request.FullName, request.Bio, request.AvatarUrl, request.DateOfBirth);
        if (!string.IsNullOrEmpty(request.CoverPhotoUrl)) user.UpdateCoverPhoto(request.CoverPhotoUrl);

        await _userRepository.SaveChangesAsync();
        return ApiResponse.Ok("Cập nhật profile thành công");
    }

    public async Task<ApiResponse> ChangePasswordAsync(Guid currentUserId, ChangePasswordDto request)
    {
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null || user.IsDeleted) return ApiResponse.NotFound("Không tìm thấy người dùng");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded) return ApiResponse.Fail("Thất bại.", result.Errors.Select(e => e.Description).ToList());

        // 🚀 BẢO MẬT: Thu hồi toàn bộ phiên đăng nhập của người dùng sau khi đổi mật khẩu
        await _sessionService.RevokeAllSessionsAsync(currentUserId);

        return ApiResponse.Ok("Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.");
    }

    public async Task<ApiResponse<PagedResult<UserSummaryDto>>> SearchUsersAsync(Guid currentUserId, UserSearchDto request)
    {
        var pagedUsers = await _userRepository.SearchUsersAsync(request.Keyword ?? string.Empty, request.PageNumber, request.PageSize);
        var dtos = new List<UserSummaryDto>();
        foreach (var u in pagedUsers.Items)
        {
            var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, u.Id);
            dtos.Add(new UserSummaryDto { Id = u.Id, UserName = u.UserName ?? string.Empty, FullName = u.FullName, AvatarUrl = u.AvatarUrl, IsFriend = friendship?.Status == FriendshipStatus.Accepted, FriendshipStatus = friendship?.Status });
        }
        return ApiResponse<PagedResult<UserSummaryDto>>.Ok(new PagedResult<UserSummaryDto>(dtos, request.PageNumber, request.PageSize, pagedUsers.TotalCount));
    }

    public async Task<ApiResponse> DeactivateAccountAsync(Guid currentUserId)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null || user.IsDeleted) return ApiResponse.NotFound("Không tìm thấy.");

        user.SoftDelete();
        await _userRepository.SaveChangesAsync();

        // 🚀 BẢO MẬT: Thu hồi toàn bộ phiên đăng nhập khi tài khoản bị vô hiệu hóa
        await _sessionService.RevokeAllSessionsAsync(currentUserId);

        return ApiResponse.Ok("Đã vô hiệu hóa tài khoản và đăng xuất khỏi mọi thiết bị.");
    }

    public async Task<ApiResponse> RestoreAccountAsync(Guid currentUserId)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null) return ApiResponse.NotFound("Không tìm thấy.");
        if (!user.IsDeleted) return ApiResponse.BadRequest("Tài khoản đang hoạt động.");
        if (user.DeletedAt.HasValue && user.DeletedAt.Value < DateTime.UtcNow.AddDays(-30)) return ApiResponse.BadRequest("Quá 30 ngày.");

        user.Restore();
        await _userRepository.SaveChangesAsync();

        return ApiResponse.Ok("Khôi phục thành công.");
    }

    private const string AuthenticatorUriFormat = "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

    public async Task<ApiResponse<TwoFactorSetupDto>> GetTwoFactorSetupAsync(Guid currentUserId)
    {
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null || user.IsDeleted) return ApiResponse<TwoFactorSetupDto>.NotFound("Không tìm thấy.");

        var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(unformattedKey))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var issuer = UrlEncoder.Default.Encode("SocialGraph");
        var account = UrlEncoder.Default.Encode(user.Email ?? user.UserName!);
        var dto = new TwoFactorSetupDto { SharedKey = unformattedKey!, AuthenticatorUri = string.Format(AuthenticatorUriFormat, issuer, account, unformattedKey) };

        return ApiResponse<TwoFactorSetupDto>.Ok(dto);
    }

    public async Task<ApiResponse<IEnumerable<string>>> EnableTwoFactorAsync(Guid currentUserId, VerifyTwoFactorDto request)
    {
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null || user.IsDeleted) return ApiResponse<IEnumerable<string>>.NotFound("Không tìm thấy.");

        if (!await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code))
            return ApiResponse<IEnumerable<string>>.BadRequest("Mã không hợp lệ.");

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return ApiResponse<IEnumerable<string>>.Ok(await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10) ?? new List<string>(), "Đã bật 2FA.");
    }

    public async Task<ApiResponse> DisableTwoFactorAsync(Guid currentUserId, VerifyTwoFactorDto request)
    {
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null || user.IsDeleted) return ApiResponse.NotFound("Không tìm thấy.");

        if (!await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code))
            return ApiResponse.BadRequest("Mã không hợp lệ.");

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);

        return ApiResponse.Ok("Đã tắt 2FA.");
    }

    public async Task<ApiResponse<IEnumerable<string>>> GenerateTwoFactorRecoveryCodesAsync(Guid currentUserId)
    {
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null || !await _userManager.GetTwoFactorEnabledAsync(user))
            return ApiResponse<IEnumerable<string>>.BadRequest("Chưa bật 2FA.");

        return ApiResponse<IEnumerable<string>>.Ok(await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10) ?? new List<string>(), "Đã tạo mã mới.");
    }

    public async Task<ApiResponse> UpdateAvatarAsync(Guid currentUserId, IFormFile file)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null) return ApiResponse.NotFound("Không tìm thấy.");

        if (!string.IsNullOrEmpty(user.AvatarUrl)) await _fileStorageService.DeleteFileAsync(user.AvatarUrl);

        var newUrl = await _fileStorageService.UploadFileAsync(file, "avatars");
        user.UpdateProfile(user.FullName, user.Bio, newUrl, user.DateOfBirth);

        await _userRepository.SaveChangesAsync();
        return ApiResponse.Ok("Đã cập nhật Avatar.");
    }

    public async Task<ApiResponse> UpdateCoverPhotoAsync(Guid currentUserId, IFormFile file)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null) return ApiResponse.NotFound("Không tìm thấy.");

        if (!string.IsNullOrEmpty(user.CoverPhotoUrl)) await _fileStorageService.DeleteFileAsync(user.CoverPhotoUrl);

        var newUrl = await _fileStorageService.UploadFileAsync(file, "covers");
        user.UpdateCoverPhoto(newUrl);

        await _userRepository.SaveChangesAsync();
        return ApiResponse.Ok("Đã cập nhật ảnh bìa.");
    }

    public async Task<ApiResponse> UpdatePrivacySettingsAsync(Guid currentUserId, UpdatePrivacyDto request)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null) return ApiResponse.NotFound("Không tìm thấy.");

        user.UpdatePrivacySettings(request.ProfileVisibility);
        await _userRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã cập nhật quyền riêng tư.");
    }
}