import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { LoginArgs } from './dto/args/login.args';
import { AuthService } from './auth.service';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { User } from '../user/user.model';
import { LoginResponse } from './dto/types/login-response.type';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query(() => LoginResponse)
  async login(@Args() loginData: LoginArgs) {
    return this.authService.login(loginData);
  }

  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserData') createUserData: CreateUserInput) {
    return this.authService.createUser(createUserData);
  }
}
