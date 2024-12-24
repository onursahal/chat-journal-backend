import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcrypt';
import { ErrorService, ErrorCode } from '../error/error.service';
import { GraphQLError } from 'graphql';
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

  async validateUserFromAccessToken(payload: TokenPayload) {
    try {
      const { sub: userId } = payload;

      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

      this.logger.debug(
        'validateUserFromAccessToken: jwt access token validated',
      );

      return true;
    } catch (error) {
      this.logger.debug('Error in validateUserFromAccessToken: ', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw this.errorService.handleJwtError(error, true);
    }
  }

  async validateUser(payload: UserCredentials): Promise<User> {
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
}
