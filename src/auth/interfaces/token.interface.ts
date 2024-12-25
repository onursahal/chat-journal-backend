export interface TokenPayload {
  sub: string;
  email: string;
  exp?: number;
}

export interface GenerateTokenArgs {
  payload?: TokenPayload;
  currentRefreshToken?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  isActive: boolean;
  expiresAt: Date;
}
