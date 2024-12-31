import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GetUserArgs } from './dto/args/get-user.args';
import { ErrorService } from '../error/error.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private errorService: ErrorService,
  ) {}

  async findOneById(data: GetUserArgs) {
    try {
      const { id } = data;

      return await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      throw this.errorService.handlePrismaError(error);
    }
  }
}

//TODO: When we give return type User, it getting error. Check it.
