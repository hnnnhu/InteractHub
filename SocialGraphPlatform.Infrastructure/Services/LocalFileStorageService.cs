using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SocialGraphPlatform.Application.Interfaces;

namespace SocialGraphPlatform.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _webHostEnvironment;
    private const string UploadsFolder = "uploads";

    public LocalFileStorageService(IWebHostEnvironment webHostEnvironment)
    {
        _webHostEnvironment = webHostEnvironment;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Tệp tin không hợp lệ.");

        // 1. Xác định đường dẫn vật lý đến thư mục wwwroot/uploads/{folderName}
        // Kết quả ví dụ: C:\MyProject\wwwroot\uploads\avatars
        string uploadsPath = Path.Combine(_webHostEnvironment.WebRootPath, UploadsFolder, folderName);

        // 2. Tạo thư mục nếu chưa tồn tại
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        // 3. Tạo tên file duy nhất để tránh trùng lặp (dùng GUID)
        // Ví dụ: a1b2c3d4-e5f6...jpg
        string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        string fullPath = Path.Combine(uploadsPath, fileName);

        // 4. Lưu file vào ổ cứng
        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 5. Trả về URL tương đối để lưu vào Database
        // Kết quả ví dụ: /uploads/avatars/a1b2c3d4.jpg
        return $"/{UploadsFolder}/{folderName}/{fileName}";
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return false;

        try
        {
            // 1. Chuyển đổi URL từ Database thành đường dẫn vật lý trên ổ cứng
            // Lưu ý: fileUrl thường bắt đầu bằng "/" nên cần Trim để Path.Combine hoạt động đúng
            string relativePath = fileUrl.TrimStart('/');
            string fullPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath);

            // 2. Kiểm tra nếu file tồn tại thì xóa
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }

            return false;
        }
        catch (Exception)
        {
            // Có thể log lỗi ở đây nếu cần
            return false;
        }
    }
}