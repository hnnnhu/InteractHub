using Microsoft.AspNetCore.Identity;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities;

public class User : IdentityUser<Guid>
{
    // ── 1. THÔNG TIN PROFILE ──
    public string FullName { get; private set; } = string.Empty;
    public string? Bio { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string? CoverPhotoUrl { get; private set; }
    public DateTime? DateOfBirth { get; private set; }

    // ── 2. CÀI ĐẶT (SETTINGS) ──
    public PrivacyLevel ProfileVisibility { get; private set; } = PrivacyLevel.Public;

    // ── 3. AUDIT LOGS ──
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // ── 4. NAVIGATION PROPERTIES ──

    // Quan hệ nội dung
    public virtual ICollection<Post> Posts { get; private set; } = new List<Post>();
    public virtual ICollection<Comment> Comments { get; private set; } = new List<Comment>();
    public virtual ICollection<Reaction> Reactions { get; private set; } = new List<Reaction>();
    public virtual ICollection<Story> Stories { get; private set; } = new List<Story>();
    public virtual ICollection<SavedPost> SavedPosts { get; private set; } = new List<SavedPost>();
    public virtual ICollection<Notification> NotificationsReceived { get; private set; } = new List<Notification>();
    public virtual ICollection<PostReport> PostReports { get; private set; } = new List<PostReport>();

    // Quan hệ bạn bè (Friendship chứa FriendshipStatus)
    // Khi bạn muốn biết trạng thái kết bạn, bạn sẽ truy vấn qua 2 danh sách này
    public virtual ICollection<Friendship> SentFriendRequests { get; private set; } = new List<Friendship>();
    public virtual ICollection<Friendship> ReceivedFriendRequests { get; private set; } = new List<Friendship>();

    // Quan hệ chặn
    public virtual ICollection<Block> BlocksInitiated { get; private set; } = new List<Block>();
    public virtual ICollection<Block> BlocksReceived { get; private set; } = new List<Block>();

    // ── 5. CONSTRUCTORS ──
    public User() : base()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
        IsDeleted = false;
        ProfileVisibility = PrivacyLevel.Public; // Thiết lập giá trị mặc định khi tạo tài khoản
    }

    public User(string fullName) : this()
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("FullName không được để trống", nameof(fullName));
        FullName = fullName.Trim();
    }

    // ── 6. DOMAIN BEHAVIORS ──
    public void UpdateProfile(string fullName, string? bio, string? avatarUrl, DateTime? dob)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("FullName không được để trống", nameof(fullName));

        FullName = fullName.Trim();
        Bio = bio?.Trim();
        AvatarUrl = avatarUrl?.Trim();
        DateOfBirth = dob;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateCoverPhoto(string? coverPhotoUrl)
    {
        CoverPhotoUrl = coverPhotoUrl?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    // Cập nhật cài đặt quyền riêng tư
    public void UpdatePrivacySettings(PrivacyLevel visibility)
    {
        ProfileVisibility = visibility;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;

        // Khóa tài khoản ở cấp độ Identity để user không thể đăng nhập
        LockoutEnabled = true;
        LockoutEnd = DateTimeOffset.MaxValue;
    }

    public void Restore()
    {
        IsDeleted = false;
        DeletedAt = null;

        // Mở khóa tài khoản
        LockoutEnd = null;
        LockoutEnabled = false;
    }
}