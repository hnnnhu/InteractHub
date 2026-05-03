using System;
using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Mối quan hệ (Friendship).
    /// Quản lý luồng kết bạn giữa 2 người dùng.
    /// Kế thừa AuditableEntity để truy vết dấu vết lịch sử.
    /// </summary>
    public class Friendship : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---
        public Guid RequesterId { get; private set; }
        public Guid AddresseeId { get; private set; }
        public FriendshipStatus Status { get; private set; }

        /// <summary>
        /// Đánh dấu đây là mối quan hệ bạn thân.
        /// Chỉ có hiệu lực khi trạng thái là Accepted.
        /// </summary>
        public bool IsCloseFriend { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---
        public virtual User Requester { get; private set; } = null!;
        public virtual User Addressee { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---
        protected Friendship() { }

        public Friendship(Guid requesterId, Guid addresseeId)
        {
            if (requesterId == Guid.Empty || addresseeId == Guid.Empty)
                throw new ArgumentException("ID người dùng không hợp lệ.");

            if (requesterId == addresseeId)
                throw new InvalidOperationException("Không thể tự kết bạn với chính mình!");

            RequesterId = requesterId;
            AddresseeId = addresseeId;
            Status = FriendshipStatus.Pending;
            IsCloseFriend = false; // Mặc định không phải bạn thân

            SetCreatedBy(requesterId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Chấp nhận lời mời kết bạn
        /// </summary>
        public void Accept(Guid updaterId)
        {
            if (Status != FriendshipStatus.Pending)
                throw new InvalidOperationException("Chỉ có thể chấp nhận lời mời đang chờ duyệt.");

            Status = FriendshipStatus.Accepted;
            // Khi chấp nhận, chưa tự động là bạn thân – cần gọi MarkAsCloseFriend() sau
            SetUpdated(updaterId);
        }

        /// <summary>
        /// Từ chối lời mời kết bạn
        /// </summary>
        public void Decline(Guid updaterId)
        {
            if (Status != FriendshipStatus.Pending)
                throw new InvalidOperationException("Chỉ có thể từ chối lời mời đang chờ duyệt.");

            Status = FriendshipStatus.Declined;
            // Từ chối xong thì SoftDelete luôn để giải phóng đường cho lần kết bạn sau
            SoftDelete(updaterId);
        }

        /// <summary>
        /// Hủy lời mời kết bạn (Thu hồi) bởi người gửi
        /// </summary>
        public void CancelByRequester(Guid updaterId)
        {
            if (Status != FriendshipStatus.Pending)
                throw new InvalidOperationException("Chỉ có thể hủy lời mời đang chờ duyệt.");

            if (updaterId != RequesterId)
                throw new InvalidOperationException("Chỉ người gửi mới có quyền thu hồi lời mời này.");

            Status = FriendshipStatus.Canceled;
            SoftDelete(updaterId);
        }

        /// <summary>
        /// Hủy kết bạn (Unfriend).
        /// Đồng thời tự động hủy luôn trạng thái bạn thân (nếu có).
        /// </summary>
        public void Remove(Guid userId)
        {
            if (Status != FriendshipStatus.Accepted)
                throw new InvalidOperationException("Chỉ có thể unfriend khi đã là bạn bè.");

            if (userId != RequesterId && userId != AddresseeId)
                throw new InvalidOperationException("Không có quyền thực hiện hành động này.");

            Status = FriendshipStatus.Removed;
            IsCloseFriend = false; // Hủy bạn bè thì không còn là bạn thân

            SoftDelete(userId);
        }

        /// <summary>
        /// Phục hồi bản ghi (Tái sử dụng) khi gửi lại lời mời kết bạn.
        /// Xử lý luôn việc đảo ngược vai trò Requester/Addressee nếu cần.
        /// </summary>
        public void RenewRequest(Guid newRequesterId, Guid newAddresseeId)
        {
            RequesterId = newRequesterId;
            AddresseeId = newAddresseeId;
            Status = FriendshipStatus.Pending;
            IsCloseFriend = false; // Bắt đầu một lời mời mới, không phải bạn thân

            // Gọi hàm Restore từ Base Class (AuditableEntity) để clear các trường xóa
            Restore();

            SetUpdated(newRequesterId);
        }

        // --- 4b. HÀNH VI CLOSE FRIEND ---

        /// <summary>
        /// Đánh dấu người này là bạn thân.
        /// Chỉ thực hiện được khi trạng thái hiện tại là Accepted.
        /// </summary>
        public void MarkAsCloseFriend()
        {
            if (Status != FriendshipStatus.Accepted)
                throw new InvalidOperationException("Chỉ có thể đánh dấu bạn thân khi đã là bạn bè (Accepted).");

            IsCloseFriend = true;
        }

        /// <summary>
        /// Bỏ đánh dấu bạn thân.
        /// </summary>
        public void UnmarkAsCloseFriend()
        {
            IsCloseFriend = false;
        }

        // --- 5. HELPER METHODS ---

        /// <summary>
        /// Kiểm tra xem bản ghi này có phải là mối quan hệ giữa 2 User cụ thể không
        /// </summary>
        public bool IsBetween(Guid userA, Guid userB)
        {
            return (RequesterId == userA && AddresseeId == userB)
                || (RequesterId == userB && AddresseeId == userA);
        }
    }
}