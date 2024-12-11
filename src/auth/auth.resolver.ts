import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { LoginArgs } from './dto/args/login.args';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { LoginResponse } from './dto/types/login-response.type';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { ValidateUserArgs } from './dto/args/validate-user.args';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Query(() => LoginResponse)
  async login(@Args() loginData: LoginArgs): Promise<LoginResponse> {
    return this.authService.login(loginData);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async validateUser(@Args() validateUserArgs: ValidateUserArgs) {
    return this.authService.validateUser(validateUserArgs);
  }

  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserData') createUserData: CreateUserInput) {
    return this.authService.createUser(createUserData);
  }
}
