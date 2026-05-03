// src/types/session.ts

// ==========================================
// 1. DTOs (Dữ liệu nhận về từ Backend)
// ==========================================

/**
 * Thông tin chi tiết của một phiên đăng nhập (thiết bị) đang hoạt động.
 * Tương ứng với SessionDto trong C#.
 */
export interface SessionDto {
    /** ID của phiên đăng nhập (Dùng để gửi lên yêu cầu hủy phiên) */
    id: string;

    /** Thông tin thiết bị (Ví dụ: "Chrome on Windows", "iPhone 15 Pro") */
    deviceInfo?: string | null;

    /** Địa chỉ IP thực hiện đăng nhập */
    ipAddress?: string | null;

    /** Thời điểm đăng nhập lần đầu (Định dạng ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ) */
    createdAt: string;

    /** Thời điểm hoạt động cuối cùng của phiên này (Định dạng ISO 8601) */
    lastActiveAt: string;

    /** Đánh dấu đây có phải là phiên mà người dùng đang sử dụng để gọi API hay không */
    isCurrent: boolean;
}

// ==========================================
// 2. REQUESTS (Payload gửi lên Backend)
// ==========================================

/**
 * DTO dùng để gửi yêu cầu hủy một phiên đăng nhập cụ thể.
 * Tương ứng với RevokeSessionRequest trong C#.
 * LƯU Ý: Nếu Controller Backend sử dụng [HttpDelete("me/sessions/{sessionId:guid}")] 
 * thì bạn chỉ cần truyền sessionId vào URL chứ không cần dùng interface này.
 * Interface này được giữ lại để dự phòng nếu đổi sang phương thức POST/chứa trong Body.
 */
export interface RevokeSessionRequest {
    /** ID phiên đăng nhập cần hủy */
    sessionId: string;
}