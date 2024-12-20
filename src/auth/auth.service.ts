import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { LoginArgs } from './dto/args/login.args';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/inputs/create-user.input';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async login(data: LoginArgs) {
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

    const userWithoutPassword = { ...user, password: undefined };

    return userWithoutPassword;
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
