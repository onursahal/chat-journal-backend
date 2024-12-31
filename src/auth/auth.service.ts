import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcrypt';
import { ErrorService, ErrorCode } from '../error/error.service';
import { TokenService } from './token.service';
import { TokenPair, TokenPayload } from './interfaces/token.interface';
import { CreateUser, UserCredentials } from './interfaces/auth.interface';
import { User } from '../user/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private errorService: ErrorService,
    private tokenService: TokenService,
  ) {}

  async login(payload: TokenPayload): Promise<TokenPair> {
    return {
      ...(await this.tokenService.getTokenPair({ payload })),
    };
  }

  async createUser(data: CreateUser): Promise<User> {
    const { email, password } = data;

    const isUserAlreadyExists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!!isUserAlreadyExists)
      throw this.errorService.createError(ErrorCode.USER_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10).catch(() => {
      throw this.errorService.createError(ErrorCode.BCRYPT_ERROR);
    });

    const createdUser = await this.prismaService.user
      .create({
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
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error);
      });

    return createdUser;
  }

  async validateUserFromAccessToken(payload: TokenPayload) {
    try {
      const { sub: userId } = payload;

      await this.prismaService.user
        .findUniqueOrThrow({
          where: {
            id: userId,
          },
        })
        .catch((error) => {
          throw this.errorService.handlePrismaError(error);
        });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async validateUser(payload: UserCredentials): Promise<User> {
    const { email, password } = payload;
    const user = await this.prismaService.user
      .findUniqueOrThrow({
        where: {
          email,
        },
      })
      .catch((error) => {
        throw this.errorService.handlePrismaError(error);
      });

    const isPasswordValid = await bcrypt
      .compare(password, user.password)
      .catch(() => {
        throw this.errorService.createError(ErrorCode.BCRYPT_ERROR);
      });

    if (!isPasswordValid)
      throw this.errorService.createError(ErrorCode.INVALID_CREDENTIALS);

    const userWithoutPassword = { ...user, password: undefined };

    return userWithoutPassword;
  }
}
