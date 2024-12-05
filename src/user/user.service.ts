import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GetUserArgs } from './dto/args/get-user.args';
import { CreateUserInput } from './dto/inputs/create-user.input';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findOneById(data: GetUserArgs) {
    const { id } = data;
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  createUser(data: CreateUserInput) {
    return this.prisma.user.create({ data });
  }
}

//TODO: When we give return type User, it getting error. Check it.
