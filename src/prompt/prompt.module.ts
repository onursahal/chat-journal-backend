import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptResolver } from './prompt.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PromptService, PromptResolver, PrismaService],
})
export class PromptModule {}
