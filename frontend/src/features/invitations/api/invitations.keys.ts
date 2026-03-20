export const invitationsKeys = {
  all: ["invitations"] as const,
  list: () => [...invitationsKeys.all, "list"] as const,
  token: (token: string) => [...invitationsKeys.all, "token", token] as const,
};

