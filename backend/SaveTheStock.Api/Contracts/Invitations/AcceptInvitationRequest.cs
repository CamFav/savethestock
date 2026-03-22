using System.ComponentModel.DataAnnotations;

namespace SaveTheStock.Api.Contracts.Invitations;

public sealed record AcceptInvitationRequest(
    [Required]
    [MaxLength(16)]
    string Mode,

    [Required]
    [MinLength(8)]
    [MaxLength(255)]
    string Password
);
