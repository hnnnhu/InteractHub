// SocialGraphPlatform.Api/Program.cs

using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialGraphPlatform.API.Middleware;
using SocialGraphPlatform.Application.Extensions;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Mappings.Profiles;
using SocialGraphPlatform.Application.Providers;
using SocialGraphPlatform.Application.Services;
using SocialGraphPlatform.Application.Validators.Auth;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;
using SocialGraphPlatform.Infrastructure.Providers;
using SocialGraphPlatform.Infrastructure.Repositories;
using SocialGraphPlatform.Infrastructure.Services;
using SocialGraphPlatform.Infrastructure.Services.Messaging;
using SocialGraphPlatform.Infrastructure.Settings.Email;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql.EntityFrameworkCore.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// ================================================================
// 1. DATABASE
// ================================================================
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string not found.");

{
    builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
}

// ================================================================
// 2. IDENTITY
// ================================================================
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ================================================================
// 3. JWT AUTHENTICATION
// ================================================================
var jwtSettings = configuration.GetSection("JwtSettings");
var jwtSecret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JwtSettings:Secret is missing.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// ================================================================
// 4. SERVICES, REPOSITORIES & AUTOMAPPER
// ================================================================
builder.Services.AddAutoMapper(config =>
{
    config.AddMaps(typeof(AuthProfile).Assembly);
});

builder.Services.AddApplicationServices();

// ── REPOSITORIES ──
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IReactionRepository, ReactionRepository>();
builder.Services.AddScoped<IStoryRepository, StoryRepository>();
builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
builder.Services.AddScoped<IBlockRepository, BlockRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IHashtagRepository, HashtagRepository>();
builder.Services.AddScoped<ISavedPostRepository, SavedPostRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserSessionRepository, UserSessionRepository>();

// ── SERVICES ──
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IReactionService, ReactionService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<IBlockService, BlockService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<ISavedPostService, SavedPostService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<IUserSessionService, UserSessionService>();

// ── OTHERS ──
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IBlockedUserProvider, BlockedUserProvider>();

// ── NOTIFICATION SETTINGS & MUTE (ĐÃ THÊM ĐỦ) ──
builder.Services.AddScoped<INotificationSettingsRepository, NotificationSettingsRepository>();
builder.Services.AddScoped<INotificationSettingsService, NotificationSettingsService>();
builder.Services.AddScoped<IUserMuteRepository, UserMuteRepository>();
builder.Services.AddScoped<IUserMuteService, UserMuteService>();

// ================================================================
// 5. CONTROLLERS + FLUENT VALIDATION + JSON OPTIONS
// ================================================================
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeConverter());
    });

// ================================================================
// 6. CORS
// ================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// ================================================================
// 7. KESTREL CONFIG (Upload limits)
// ================================================================
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = null;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
});

// ================================================================
// 8. SWAGGER
// ================================================================
builder.Services.AddOpenApi();

var app = builder.Build();

// ================================================================
// DATABASE INITIALIZATION
// ================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DbInitializer.InitializeAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi migrate hoặc seed database.");
    }
}

// ================================================================
// MIDDLEWARE PIPELINE
// ================================================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<UserStatusMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.Run();

// ================================================================
// JSON CONVERTERS (ĐÃ SỬA LỖI)
// ================================================================

/// <summary>
/// Converter cho DateTime không nullable – vẫn yêu cầu ISO 8601 hợp lệ, nhưng báo lỗi rõ ràng hơn.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // Nếu không phải String, dùng GetDateTime() gốc (sẽ tự throw)
        if (reader.TokenType != JsonTokenType.String)
        {
            return reader.GetDateTime().ToUniversalTime();
        }

        // Xử lý string: thử các định dạng phổ biến
        string? str = reader.GetString();
        if (string.IsNullOrEmpty(str))
        {
            throw new JsonException("DateTime string is null or empty.");
        }

        // Thử parse như DateTimeOffset để tôn trọng offset nếu có
        if (DateTimeOffset.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTimeOffset dto))
        {
            return dto.UtcDateTime;
        }

        // Nếu không parse được, throw lỗi chi tiết
        throw new JsonException($"The value '{str}' is not a valid ISO 8601 DateTime.");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}

/// <summary>
/// Converter cho DateTime? nullable – xử lý an toàn: null, chuỗi rỗng, hoặc định dạng không chuẩn đều trả về null.
/// </summary>
public class UtcNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // Null token → null
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        // Chỉ xử lý String token, các token khác bỏ qua và trả về null (hoặc có thể throw)
        if (reader.TokenType != JsonTokenType.String)
            return null;

        string? str = reader.GetString();

        // Chuỗi rỗng hoặc null string → null
        if (string.IsNullOrEmpty(str))
            return null;

        // Thử parse dưới dạng DateTimeOffset (hỗ trợ ISO 8601, offset,…)
        if (DateTimeOffset.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTimeOffset dto))
        {
            return dto.UtcDateTime;
        }

        // Nếu không parse được, trả về null thay vì crash
        return null;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteStringValue(value.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}