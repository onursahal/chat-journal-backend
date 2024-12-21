import { Resolver, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.model';
import { UserService } from './user.service';
import { GetUserArgs } from './dto/args/get-user.args';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'user' })
  async getUser(@Args() getUserArgs: GetUserArgs): Promise<User> {
    return this.userService.findOneById(getUserArgs);
  }
}
