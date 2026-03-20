namespace SaveTheStock.Application.Accounts.ChangeMyPassword;

/// <summary>
/// Input for the ChangeMyPasswordUseCase.
/// </summary>
public sealed record ChangeMyPasswordInput(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword
);
