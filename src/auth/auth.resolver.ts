import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { LoginArgs } from './dto/args/login.args';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { LoginResponse } from './dto/types/login-response.type';
import { ValidateUserArgs } from './dto/args/validate-user.args';
import { VerifyRefreshTokenArgs } from './dto/args/verify-refresh-token.args';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshAuthGuard } from './jwt-refresh-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Query(() => LoginResponse)
  async login(@Args() loginData: LoginArgs): Promise<LoginResponse> {
    return this.authService.login(loginData);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Query(() => LoginResponse)
  async verifyRefreshToken(
    @Args() verifyRefreshTokenArgs: VerifyRefreshTokenArgs,
  ): Promise<LoginResponse> {
    return this.authService.verifyRefreshToken(verifyRefreshTokenArgs);
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
