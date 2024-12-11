import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Prompt } from './prompt.model';
import { PromptService } from './prompt.service';
import { GetAllPromptsWithUserIdArgs } from './dto/args/get-all-prompts-with-user-id.args';
import { CreatePromptInput } from './dto/inputs/create-prompt.input';
import { GetAllPromptsWithConversationIdArgs } from './dto/args/get-all-prompts-with-conversation-id.args';

@Resolver(() => Prompt)
export class PromptResolver {
  constructor(private promptService: PromptService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [Prompt])
  async getAllPromptsWithUserId(
    @Args()
    getAllPromptsWithUserIdArgs: GetAllPromptsWithUserIdArgs,
  ): Promise<Prompt[]> {
    return this.promptService.findAllByUserId(getAllPromptsWithUserIdArgs);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Prompt])
  async getAllPromptsWithConversationId(
    @Args()
    getAllPromptsWithConversationIdArgs: GetAllPromptsWithConversationIdArgs,
  ): Promise<Prompt[]> {
    return this.promptService.findAllByConversationId(
      getAllPromptsWithConversationIdArgs,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Prompt)
  async createPrompt(
    @Args('createPromptInput') createPromptInput: CreatePromptInput,
  ): Promise<Prompt> {
    return this.promptService.createPrompt(createPromptInput);
  }
}
