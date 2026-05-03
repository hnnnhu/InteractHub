using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class BlockProfile : Profile
{
    public BlockProfile()
    {
        CreateMap<Block, BlockedUserDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Blocked.UserName))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Blocked.FullName))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Blocked.AvatarUrl))
            .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Blocked.Bio))
            .ForMember(dest => dest.BlockedAt, opt => opt.MapFrom(src => src.CreatedAt));
    }
}