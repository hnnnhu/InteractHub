using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Reaction;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class ReactionProfile : Profile
{
    public ReactionProfile()
    {
        CreateMap<Reaction, ReactionSummaryDto>()
            .ForMember(dest => dest.TypeName, opt => opt.MapFrom(src => src.Type.ToString()));

        CreateMap<Reaction, UserReactionDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.User.AvatarUrl));
    }
}