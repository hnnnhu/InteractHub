using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Auth;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class AuthProfile : Profile
{
    public AuthProfile()
    {
        CreateMap<User, AuthResponseDto>()
            .ForMember(dest => dest.Token, opt => opt.Ignore())
            .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
            .ForMember(dest => dest.ExpiresAt, opt => opt.Ignore())
            .ForMember(dest => dest.RefreshTokenExpiresAt, opt => opt.Ignore());

        CreateMap<RegisterRequestDto, User>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email));
    }
}