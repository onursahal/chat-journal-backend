import { Resolver, Args, Query } from '@nestjs/graphql';
import { User } from './user.model';
import { UserService } from './user.service';
import { GetUserArgs } from './dto/args/get-user.args';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User, { name: 'user' })
  async getUser(@Args() getUserArgs: GetUserArgs): Promise<User> {
    return this.userService.findOneById(getUserArgs);
  }
}
