import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, JwtPayload } from './auth.types';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    return this.userService.create({
      login: dto.login,
      password: dto.password,
      role: UserRole.VIEWER,
    });
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userService.findByLoginWithPassword(dto.login);
    if (!user) {
      throw new ForbiddenException('Authentication failed');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('Authentication failed');
    }

    return this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role as unknown as UserRole,
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new BadRequestException('JWT secrets are not configured');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.userService.findByLoginWithPassword(payload.login);
    if (!user || user.id !== payload.userId) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    return this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role as unknown as UserRole,
    });
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const accessTtl = process.env.JWT_ACCESS_TTL ?? '15m';
    const refreshTtl = process.env.JWT_REFRESH_TTL ?? '7d';

    if (!accessSecret || !refreshSecret) {
      throw new BadRequestException('JWT secrets are not configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessTtl,
      } as any),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTtl,
      } as any),
    ]);

    return { accessToken, refreshToken };
  }
}
