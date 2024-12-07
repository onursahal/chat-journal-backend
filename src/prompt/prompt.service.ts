import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GetAllPromptsWithUserIdArgs } from './dto/args/get-all-prompts-with-user-id.args';
import { CreatePromptInput } from './dto/inputs/create-prompt.input';
import { GetAllPromptsWithConversationIdArgs } from './dto/args/get-all-prompts-with-conversation-id.args';
@Injectable()
export class PromptService {
  constructor(private prismaService: PrismaService) {}

  findAllByUserId(data: GetAllPromptsWithUserIdArgs) {
    const { userId } = data;
    return this.prismaService.prompt.findMany({
      where: { userId },
    });
  }

  findAllByConversationId(data: GetAllPromptsWithConversationIdArgs) {
    const { conversationId } = data;
    return this.prismaService.prompt.findMany({
      where: { conversationId },
    });
  }

  // TODO: Enhance security of conversationId generation
  // - Consider hashing the userId
  // - Add proper encryption
  // - Implement more secure ID generation

  createPrompt(data: CreatePromptInput) {
    const { userId, prompt } = data;
    const dummyResponse = 'This is a dummy response';
    const today = new Date().toISOString().split('T')[0];
    const conversationId = `${userId}-${today}`;

    return this.prismaService.prompt.create({
      data: {
        prompt,
        response: dummyResponse,
        userId,
        conversationId,
      },
    });
  }
}
