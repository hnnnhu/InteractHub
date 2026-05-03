using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Report;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class ReportProfile : Profile
{
    public ReportProfile()
    {
        CreateMap<PostReport, PostReportResponseDto>()
            .ForMember(dest => dest.ReporterUserName, opt => opt.MapFrom(src => src.Reporter.UserName))
            .ForMember(dest => dest.ReporterFullName, opt => opt.MapFrom(src => src.Reporter.FullName))
            .ForMember(dest => dest.ReporterAvatarUrl, opt => opt.MapFrom(src => src.Reporter.AvatarUrl))
            .ForMember(dest => dest.PostContent, opt => opt.MapFrom(src => src.Post.Content))
            .ForMember(dest => dest.PostMediaUrl, opt => opt.MapFrom(src => src.Post.MediaItems.FirstOrDefault().MediaUrl))
            .ForMember(dest => dest.PostAuthorUserName, opt => opt.MapFrom(src => src.Post.User.UserName))
            .ForMember(dest => dest.ReasonLabel, opt => opt.MapFrom(src => src.Reason.ToString()))
            .ForMember(dest => dest.StatusLabel, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ProcessedByUserName, opt => opt.Ignore());
    }
}