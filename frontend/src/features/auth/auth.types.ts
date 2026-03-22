export type AuthResponse = {
  jwtToken: string;
  accountId: string;
  companyId: string;
  companyName: string;
  expiresInMinutes: number;
  role: string;
  displayName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  companyName: string;
  ownerDisplayName: string;
  ownerEmail: string;
  password: string;
};
