import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PromptService {
  constructor(private prisma: PrismaService) {}

  findAllByUserId(userId: string) {
    return this.prisma.prompt.findMany({
      where: { id: userId },
    });
  }
}
