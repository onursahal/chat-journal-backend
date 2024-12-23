import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './dto/types/login-response.type';
import { ErrorService, ErrorCode } from '../error/error.service';
import { GraphQLError } from 'graphql';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private errorService: ErrorService,
  ) {}

  async login(userId: string, email: string): Promise<LoginResponse> {
    const payload = { sub: userId, email };

    this.logger.debug('login: token pair created');
    return {
      ...(await this.getTokenPair({ payload })),
    };
  }

  async getTokenPairWithRefreshToken(currentRefreshToken: string) {
    return await this.getTokenPair({ currentRefreshToken });
  }

  async createUser(data: CreateUserInput) {
    const { email, password } = data;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw this.errorService.createError(ErrorCode.USER_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);

    this.logger.debug('createUser: user created');
    return this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });
  }

  async validateRefreshToken(payload: {
    sub: string;
    email: string;
    exp: number;
  }) {
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

  async validateAccessToken(payload: {
    sub: string;
    email: string;
    exp: number;
  }) {
    try {
      const { sub: userId } = payload;

      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

      this.logger.debug('validateAccessToken: jwt access token validated');

      return true;
    } catch (error) {
      this.logger.debug('Error in validateAccessToken: ', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw this.errorService.handleJwtError(error, true);
    }
  }

  async validateUser(payload: { email: string; password: string }) {
    const { email, password } = payload;
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

    this.logger.debug('validateUser: user found');

    // TODO: add error handling for bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw this.errorService.createError(ErrorCode.INVALID_CREDENTIALS);

    const userWithoutPassword = { ...user, password: undefined };

    this.logger.debug('validateUser: user validated');
    return userWithoutPassword;
  }

  private async getTokenPair({
    payload,
    currentRefreshToken,
  }: {
    payload?: { sub: string; email: string };
    currentRefreshToken?: string;
  }) {
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

  private async generateRefreshToken({
    payload,
    currentRefreshToken,
  }: {
    payload?: { sub: string; email: string };
    currentRefreshToken?: string;
  }) {
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

    await this.prismaService.refreshToken.create({
      data: {
        id: refresh_token,
        expiresAt: new Date(exp * 1000),
        userId,
      },
    });
    this.logger.debug('generateRefreshToken: refresh token created');
    return refresh_token;
  }

  private async blacklistRefreshTokens(userId: string) {
    return await this.prismaService.refreshToken.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }
}
