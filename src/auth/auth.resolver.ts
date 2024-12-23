import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { LoginArgs } from './dto/args/login.args';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { LoginResponse } from './dto/types/login-response.type';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { Logger } from '@nestjs/common';
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Query(() => LoginResponse)
  async login(
    @Args() loginData: LoginArgs,
    @Context() context: any,
  ): Promise<LoginResponse> {
    this.logger.debug(
      'login resolver: initiated with email: ',
      loginData.email,
    );
    const user = context.req.user;
    return this.authService.login(user.id, user.email);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Query(() => LoginResponse)
  async getTokenPairWithRefreshToken(
    @Args('currentRefreshToken') currentRefreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.getTokenPairWithRefreshToken(currentRefreshToken);
  }

  // TODO: Check which guard needs to be used here
  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserData') createUserData: CreateUserInput) {
    return this.authService.createUser(createUserData);
  }
}
