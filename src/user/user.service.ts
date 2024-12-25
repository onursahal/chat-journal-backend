import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GetUserArgs } from './dto/args/get-user.args';
import { ErrorService } from '../error/error.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
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
      this.logger.debug('Full error object:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
      throw this.errorService.handlePrismaError(error.code);
    }
  }
}

//TODO: When we give return type User, it getting error. Check it.
