import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import { ErrorService, ErrorCode } from '../error/error.service';
import {
  GenerateTokenArgs,
  RefreshToken,
  TokenPair,
  TokenPayload,
} from './interfaces/token.interface';
import { User } from 'src/user/user.model';

@Injectable()
export class TokenService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private errorService: ErrorService,
  ) {}
  async getTokenPair({
    payload,
    currentRefreshToken,
  }: GenerateTokenArgs): Promise<TokenPair> {
    const { sub, email } = this.extractUserIdentity({
      currentRefreshToken,
      payload,
    });
    try {
      const accessToken = await this.generateAccessToken({ sub, email });

      const refreshToken = await this.generateRefreshToken({
        currentRefreshToken,
        payload,
      });

      return { accessToken, refreshToken };
    } catch {
      throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
    }
  }

  async validateRefreshToken(currentRefreshToken: string): Promise<User> {
    const { sub } = this.extractUserIdentity({
      currentRefreshToken,
    });

    const activeRefreshToken: RefreshToken =
      await this.prismaService.refreshToken
        .findFirstOrThrow({
          where: {
            id: currentRefreshToken,
            userId: sub,
            isActive: true,
          },
        })
        .catch((error) => {
          throw this.errorService.handlePrismaError(error);
        });

    if (activeRefreshToken.expiresAt.valueOf() < Date.now()) {
      await this.blacklistRefreshTokens(sub);
      throw this.errorService.createError(ErrorCode.REFRESH_TOKEN_EXPIRED);
    }

    return await this.prismaService.user
      .findUniqueOrThrow({
        where: {
          id: sub,
        },
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error);
      });
  }

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    const accessToken = await this.jwtService.signAsync(payload);

    return accessToken;
  }

  async generateRefreshToken({
    payload,
    currentRefreshToken,
  }: GenerateTokenArgs): Promise<string> {
    const { sub, email } = this.extractUserIdentity({
      currentRefreshToken,
      payload,
    });

    await this.blacklistRefreshTokens(sub);

    const refreshToken = await this.jwtService
      .signAsync(
        { sub, email },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        },
      )
      .catch(() => {
        throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
      });

    const { exp } = await this.jwtService.decode(refreshToken);

    await this.prismaService.refreshToken
      .create({
        data: {
          id: refreshToken,
          expiresAt: new Date(exp * 1000),
          userId: sub,
        },
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error);
      });

    return refreshToken;
  }

  async blacklistRefreshTokens(userId: string) {
    return await this.prismaService.refreshToken
      .updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error);
      });
  }
  extractUserIdentity({
    currentRefreshToken,
    payload,
  }: GenerateTokenArgs): TokenPayload {
    const { sub, email } =
      (currentRefreshToken && this.jwtService.decode(currentRefreshToken)) ||
      payload;
    return { sub, email };
  }
}
