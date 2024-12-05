import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './services/user.service';
import { PromptService } from './services/prompt.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  providers: [UserResolver, UserService, PromptService, PrismaService],
})
export class UserModule {}
