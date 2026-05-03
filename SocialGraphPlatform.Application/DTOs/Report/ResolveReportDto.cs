using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace SocialGraphPlatform.Application.DTOs.Report
{
    // ResolveReportDto.cs
    public class ResolveReportDto
    {
        [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
        public string? Notes { get; set; }
    }
}
