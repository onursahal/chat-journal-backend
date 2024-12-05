import {
  Resolver,
  Args,
  Query,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { User } from './models/user.model';
import { Prompt } from './models/prompt.model';
import { UserService } from './services/user.service';
import { PromptService } from './services/prompt.service';
import { GetUserArgs } from './dto/args/get-user.args';
import { CreateUserInput } from './dto/inputs/create-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private promptService: PromptService,
  ) {}

  @Query(() => User, { name: 'user' })
  async getUser(@Args() getUserArgs: GetUserArgs): Promise<User> {
    return this.userService.findOneById(getUserArgs);
  }

  @ResolveField('prompts', () => [Prompt])
  async getPrompts(@Parent() user: User) {
    const { id } = user;
    return this.promptService.findAllByUserId(id);
  }

  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserData') createUserData: CreateUserInput) {
    return this.userService.createUser(createUserData);
  }
}
