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
    };
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
