// SocialGraphPlatform.Application/DTOs/Common/ApiResponse.cs
using System.Text.Json.Serialization;

namespace SocialGraphPlatform.Application.DTOs.Common;

public class ApiResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TraceId { get; set; }

    public DateTimeOffset Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Mã trạng thái HTTP (200, 400, 403, 404, 500...) để Controller phân biệt.
    /// </summary>
    public int StatusCode { get; set; } = 200;

    public ApiResponse() { }

    private ApiResponse(bool isSuccess, string message, List<string>? errors = null, int statusCode = 200)
    {
        IsSuccess = isSuccess;
        Message = message;
        Errors = errors;
        StatusCode = statusCode;
    }

    // Factory Methods
    public static ApiResponse Ok(string message = "Thành công")
        => new(true, message, statusCode: 200);

    public static ApiResponse Fail(string message, List<string>? errors = null)
        => new(false, message, errors, 400);

    public static ApiResponse Error(string message)
        => new(false, message, statusCode: 500);

    public static ApiResponse NotFound(string message = "Không tìm thấy.")
        => new(false, message, statusCode: 404);

    public static ApiResponse Unauthorized(string message = "Không có quyền truy cập.")
        => new(false, message, statusCode: 401);

    public static ApiResponse Forbidden(string message = "Bạn không có quyền thực hiện hành động này.")
        => new(false, message, statusCode: 403);

    public static ApiResponse BadRequest(string message = "Dữ liệu không hợp lệ.", List<string>? errors = null)
        => new(false, message, errors, 400);
}

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TraceId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Mã trạng thái HTTP (200, 400, 403, 404, 500...) để Controller phân biệt.
    /// </summary>
    public int StatusCode { get; set; } = 200;

    public ApiResponse() { }

    private ApiResponse(T? data, bool isSuccess = true, string message = "Thành công", List<string>? errors = null, int statusCode = 200)
    {
        Data = data;
        IsSuccess = isSuccess;
        Message = message;
        Errors = errors;
        StatusCode = statusCode;
    }

    // Factory Methods
    public static ApiResponse<T> Ok(T? data, string message = "Thành công")
        => new(data, true, message, statusCode: 200);

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
        => new(default, false, message, errors, 400);

    public static ApiResponse<T> Error(string message)
        => new(default, false, message, statusCode: 500);

    public static ApiResponse<T> NotFound(string message = "Không tìm thấy.")
        => new(default, false, message, statusCode: 404);

    public static ApiResponse<T> Unauthorized(string message = "Không có quyền truy cập.")
        => new(default, false, message, statusCode: 401);

    public static ApiResponse<T> Forbidden(string message = "Bạn không có quyền thực hiện hành động này.")
        => new(default, false, message, statusCode: 403);

    public static ApiResponse<T> BadRequest(string message = "Dữ liệu không hợp lệ.", List<string>? errors = null)
        => new(default, false, message, errors, 400);
}