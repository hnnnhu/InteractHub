using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialGraphPlatform.Domain.Entities;

[Table("SavedPostCollections")]
public class SavedPostCollection
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property (Tùy chọn: Liên kết với bảng User nếu bạn có Entity User)
    // [ForeignKey("UserId")]
    // public virtual User? User { get; set; }
}