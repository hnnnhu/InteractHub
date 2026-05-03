// SocialGraphPlatform.Application/Interfaces/Repositories/IGenericRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using System.Linq.Expressions;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    Task<PagedResult<T>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null,
        Expression<Func<T, object>>? orderBy = null,
        bool descending = false);

    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);

    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

    IQueryable<T> Queryable();

    /// <summary>
    /// LƯU THAY ĐỔI vào Database (rất quan trọng)
    /// Tất cả Service đều sẽ gọi phương thức này
    /// </summary>
    Task SaveChangesAsync();
}