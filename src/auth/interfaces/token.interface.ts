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
  accessToken: string;
  refreshToken: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  isActive: boolean;
  expiresAt: Date;
}
