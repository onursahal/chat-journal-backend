import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Prompt } from './prompt.model';
import { PromptService } from './prompt.service';
import { GetAllPromptsWithUserIdArgs } from './dto/args/get-all-prompts-with-user-id.args';
import { CreatePromptInput } from './dto/inputs/create-prompt.input';
import { GetAllPromptsWithConversationIdArgs } from './dto/args/get-all-prompts-with-conversation-id.args';

@Resolver(() => Prompt)
export class PromptResolver {
  constructor(private promptService: PromptService) {}

  @Query(() => [Prompt])
  async getAllPromptsWithUserId(
    @Args()
    getAllPromptsWithUserIdArgs: GetAllPromptsWithUserIdArgs,
  ): Promise<Prompt[]> {
    return this.promptService.findAllByUserId(getAllPromptsWithUserIdArgs);
  }

  @Query(() => [Prompt])
  async getAllPromptsWithConversationId(
    @Args()
    getAllPromptsWithConversationIdArgs: GetAllPromptsWithConversationIdArgs,
  ): Promise<Prompt[]> {
    return this.promptService.findAllByConversationId(
      getAllPromptsWithConversationIdArgs,
    );
  }

  @Mutation(() => Prompt)
  async createPrompt(
    @Args('createPromptInput') createPromptInput: CreatePromptInput,
  ): Promise<Prompt> {
    return this.promptService.createPrompt(createPromptInput);
  }
}
