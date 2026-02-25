namespace SaveTheStock.Application.Accounts.ChangeMyPassword;

/// <summary>
/// Input for the ChangeMyPasswordUseCase.
/// </summary>
public sealed record ChangeMyPasswordInput(
    string NewPassword
);
