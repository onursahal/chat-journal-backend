import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GetUserArgs } from './dto/args/get-user.args';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findOneById(data: GetUserArgs) {
    const { id } = data;
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}

//TODO: When we give return type User, it getting error. Check it.
