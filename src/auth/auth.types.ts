import { UserRole } from '../common/enums';

export interface JwtPayload {
  userId: string;
  login: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
