import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcrypt';
import { ErrorService, ErrorCode } from '../error/error.service';
import { TokenService } from './token.service';
import { TokenPair, TokenPayload } from './interfaces/token.interface';
import { CreateUser, UserCredentials } from './interfaces/auth.interface';
import { User } from '../user/user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prismaService: PrismaService,
    private errorService: ErrorService,
    private tokenService: TokenService,
  ) {}

  async login(payload: TokenPayload): Promise<TokenPair> {
    this.logger.debug('login: token pair created');
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

    const hashedPassword = await bcrypt.hash(password, 10);

    this.logger.debug('createUser: user created');

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
        this.logger.debug('createUser: error creating user', error);
        throw this.errorService.handlePrismaError(error.code);
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
          throw this.errorService.handlePrismaError(error.code);
        });

      this.logger.debug(
        'validateUserFromAccessToken: jwt access token validated',
      );

      return true;
    } catch (error) {
      this.logger.debug('Error in validateUserFromAccessToken: ', error);

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
        throw this.errorService.handlePrismaError(error.code);
      });

    this.logger.debug('validateUser: user found');

    // TODO: add error handling for bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw this.errorService.createError(ErrorCode.INVALID_CREDENTIALS);

    const userWithoutPassword = { ...user, password: undefined };

    this.logger.debug('validateUser: user validated');
    return userWithoutPassword;
  }
}
