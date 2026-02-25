namespace SaveTheStock.Application.Common.Interfaces;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? AccountId { get; }
    Guid? CompanyId { get; }
    string? Role { get; }
}