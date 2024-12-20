import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { LoginArgs } from './dto/args/login.args';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { JwtService } from '@nestjs/jwt';
import { ValidateUserArgs } from './dto/args/validate-user.args';
import { VerifyRefreshTokenArgs } from './dto/args/verify-refresh-token.args';
import { LoginResponse } from './dto/types/login-response.type';
import { ErrorService, ErrorCode } from '../error/error.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private errorService: ErrorService,
  ) {}

  async validateUser(data: ValidateUserArgs) {
    const { email, password } = data;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw this.errorService.createError(ErrorCode.INVALID_CREDENTIALS);

    return { ...user, password: undefined };
  }

  async login(data: LoginArgs): Promise<LoginResponse> {
    const { email, password } = data;

    const user = await this.validateUser({ email, password });

    const payload = { sub: user.id, email: user.email };

    return {
      user,
      ...(await this.getTokensAsObject(payload)),
    };
  }

  async verifyRefreshToken(
    data: VerifyRefreshTokenArgs,
  ): Promise<LoginResponse> {
    const { refresh_token } = data;

    const { sub, email } = await this.jwtService
      .verifyAsync(refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET,
      })
      .catch((error) => {
        throw this.errorService.handleJwtError(error, false);
      });

    const payload = { sub, email };

    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

    return {
      user,
      ...(await this.getTokensAsObject(payload)),
    };
  }

  async createUser(data: CreateUserInput) {
    const { email, password } = data;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw this.errorService.createError(ErrorCode.USER_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);

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

  private async getTokensAsObject(payload: { sub: string; email: string }) {
    try {
      const access_token = await this.jwtService.signAsync(payload);

      const refresh_token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      });

      return { access_token, refresh_token };
    } catch {
      throw this.errorService.createError(ErrorCode.TOKEN_SIGNING_ERROR);
    }
  }
}
