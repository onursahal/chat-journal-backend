import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/db/prisma.service';
import { ErrorService, ErrorCode } from 'src/error/error.service';
import { GraphQLError } from 'graphql';
import {
  GenerateTokenArgs,
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
      this.jwtService.decode(currentRefreshToken) || payload;
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
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
    }
  }

  async validateRefreshToken(payload: TokenPayload): Promise<User> {
    const { sub: userId } = payload;
    try {
      const activeRefreshToken = await this.prismaService.refreshToken
        .findFirst({
          where: {
            userId,
            isActive: true,
          },
        })
        .catch(() => {
          throw this.errorService.createError(ErrorCode.INVALID_REFRESH_TOKEN);
        });

      if (!activeRefreshToken)
        throw this.errorService.createError(ErrorCode.INVALID_REFRESH_TOKEN);

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

      return this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      this.logger.debug('Error in verifyRefreshToken: ', error);
      if (error instanceof GraphQLError) {
        throw error;
      }

      throw this.errorService.handleJwtError(error, false);
    }
  }

  private async generateRefreshToken({
    payload,
    currentRefreshToken,
  }: GenerateTokenArgs): Promise<string> {
    const { sub: userId, email } =
      this.jwtService.decode(currentRefreshToken) || payload;

    this.logger.debug('generateRefreshToken: initiated with args: ', {
      userId,
      email,
      currentRefreshToken,
    });

    await this.blacklistRefreshTokens(userId);

    const refresh_token = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      },
    );

    const { exp } = this.jwtService.decode(refresh_token);

    await this.prismaService.refreshToken
      .create({
        data: {
          id: refresh_token,
          expiresAt: new Date(exp * 1000),
          userId,
        },
      })
      .catch((error) => {
        throw error;
      });
    this.logger.debug('generateRefreshToken: refresh token created');
    return refresh_token;
  }

  private async blacklistRefreshTokens(userId: string) {
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
        throw error;
      });
  }
}
