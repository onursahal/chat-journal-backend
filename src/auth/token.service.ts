import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(TokenService.name);
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private errorService: ErrorService,
  ) {}
  async getTokenPair({
    payload,
    currentRefreshToken,
  }: GenerateTokenArgs): Promise<TokenPair> {
    const { sub: userId, email } =
      (currentRefreshToken && this.jwtService.decode(currentRefreshToken)) ||
      payload;
    try {
      this.logger.debug('getTokenPair: initiated');

      const access_token = await this.jwtService.signAsync({
        sub: userId,
        email,
      });

      const refresh_token = await this.generateRefreshToken({
        currentRefreshToken,
        payload,
      });

      this.logger.debug('getTokenPair: token pair created');

      return { access_token, refresh_token };
    } catch {
      throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
    }
  }

  async validateRefreshToken(payload: TokenPayload): Promise<User> {
    const { sub: userId } = payload;
    try {
      const activeRefreshToken: RefreshToken =
        await this.prismaService.refreshToken
          .findFirstOrThrow({
            where: {
              userId,
              isActive: true,
            },
          })
          .catch((error) => {
            throw this.errorService.handlePrismaError(error.code);
          });

      this.logger.debug(
        'validateRefreshToken: activeRefreshToken ',
        activeRefreshToken,
      );
      if (activeRefreshToken.expiresAt.valueOf() < Date.now()) {
        await this.blacklistRefreshTokens(userId);
      }

      const isCurrentTokenBlacklisted = !activeRefreshToken.isActive;

      if (isCurrentTokenBlacklisted) {
        throw this.errorService.createError(ErrorCode.INVALID_REFRESH_TOKEN);
      }

      return await this.prismaService.user
        .findUniqueOrThrow({
          where: {
            id: userId,
          },
        })
        .catch((error) => {
          throw this.errorService.handlePrismaError(error.code);
        });
    } catch (error) {
      this.logger.debug('Error in verifyRefreshToken: ', error);
      throw error;
    }
  }

  async generateRefreshToken({
    payload,
    currentRefreshToken,
  }: GenerateTokenArgs): Promise<string> {
    const { sub: userId, email } =
      (currentRefreshToken && this.jwtService.decode(currentRefreshToken)) ||
      payload;

    this.logger.debug('generateRefreshToken: initiated with args: ', {
      userId,
      email,
      currentRefreshToken,
    });

    await this.blacklistRefreshTokens(userId);

    const refresh_token = await this.jwtService
      .signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        },
      )
      .catch(() => {
        throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
      });

    const { exp } = await this.jwtService.decode(refresh_token);

    this.logger.debug('generateRefreshToken: exp: ', exp);

    await this.prismaService.refreshToken
      .create({
        data: {
          id: refresh_token,
          expiresAt: new Date(exp * 1000),
          userId,
        },
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error.code);
      });
    this.logger.debug('generateRefreshToken: refresh token created');
    return refresh_token;
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
        throw this.errorService.handlePrismaError(error.code);
      });
  }
}
