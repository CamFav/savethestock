using SaveTheStock.Application.Accounts.Delete;

namespace SaveTheStock.Application.Accounts.DeleteMyAccount;

/// <summary>
/// UseCase to delete the authenticated user's account.
/// </summary>
public sealed class DeleteMyAccountUseCase
{
    private readonly DeleteAccountUseCase _deleteAccount;

    public DeleteMyAccountUseCase(DeleteAccountUseCase deleteAccount)
    {
        _deleteAccount = deleteAccount;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        await _deleteAccount.ExecuteDeleteMyAccountAsync(cancellationToken);
    }
}
