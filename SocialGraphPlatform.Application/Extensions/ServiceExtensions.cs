using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
// Đổi using trỏ về thư mục Profiles cụ thể
using SocialGraphPlatform.Application.Mappings.Profiles;
using SocialGraphPlatform.Application.Validators.Auth;
using System.Reflection;

namespace SocialGraphPlatform.Application.Extensions
{
    /// <summary>
    /// Extension methods để đăng ký các dịch vụ tầng Application
    /// </summary>
    public static class ServiceExtensions
    {
        /// <summary>
        /// Đăng ký tất cả các service của tầng Application
        /// </summary>
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // ====================== AutoMapper (Cách mới - AutoMapper 13+) ======================
            // Dùng AuthProfile làm class "đại sứ" để AutoMapper tìm đúng Assembly và quét tất cả các file Profile
            services.AddAutoMapper(cfg =>
            {
                cfg.AddMaps(typeof(AuthProfile).Assembly);
            });

            // ====================== FluentValidation ======================
            // Tự động quét và đăng ký tất cả Validators trong assembly
            services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

            // ====================== MediatR (nếu bạn dùng CQRS sau này) ======================
            // services.AddMediatR(cfg => 
            //     cfg.RegisterServicesFromAssemblyContaining<AuthProfile>());

            return services;
        }
    }
}