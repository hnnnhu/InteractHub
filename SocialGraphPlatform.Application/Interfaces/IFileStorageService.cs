using Microsoft.AspNetCore.Http;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>
    /// Tải lên một tệp tin (ảnh đại diện, ảnh bìa, v.v.) và trả về đường dẫn URL của tệp.
    /// </summary>
    /// <param name="file">Tệp tin được gửi từ client</param>
    /// <param name="folderName">Tên thư mục phân loại (vd: "avatars", "covers", "posts")</param>
    /// <returns>Đường dẫn URL (dạng chuỗi) dùng để truy cập file từ Frontend</returns>
    Task<string> UploadFileAsync(IFormFile file, string folderName);

    /// <summary>
    /// Xóa một tệp tin khi người dùng đổi ảnh mới hoặc xóa tài khoản (giúp tiết kiệm dung lượng)
    /// </summary>
    /// <param name="fileUrl">Đường dẫn URL của file cần xóa</param>
    /// <returns>True nếu xóa thành công, ngược lại False</returns>
    Task<bool> DeleteFileAsync(string fileUrl);
}