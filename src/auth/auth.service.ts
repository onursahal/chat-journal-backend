import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { LoginArgs } from './dto/args/login.args';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { JwtService } from '@nestjs/jwt';
import { ValidateUserArgs } from './dto/args/validate-user.args';
import { VerifyRefreshTokenArgs } from './dto/args/verify-refresh-token.args';
import { LoginResponse } from './dto/types/login-response.type';
import { Errors, ErrorString } from 'src/errors';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(data: ValidateUserArgs) {
    const { email, password } = data;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return { ...user, password: undefined };
  }

  async login(data: LoginArgs) {
    const { email, password } = data;

    const user = await this.validateUser({ email, password });

    const payload = { sub: user.id, email: user.email };

    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      }),
    };
  }

  async verifyRefreshToken(
    data: VerifyRefreshTokenArgs,
  ): Promise<LoginResponse> {
    try {
      const { refresh_token } = data;
      const { sub, email } = await this.jwtService.verifyAsync(refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const payload = { sub, email };

      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      //TODO: Return error if user not found

      return {
        user,
        access_token: await this.jwtService.signAsync(payload),
        refresh_token: await this.jwtService.signAsync(payload, {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        }),
      };
    } catch {
      Errors.throwError(ErrorString.InvalidRefreshToken);
    }
  }

  async createUser(data: CreateUserInput) {
    const { email, password } = data;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new ConflictException('User with this email already exist');

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
}
