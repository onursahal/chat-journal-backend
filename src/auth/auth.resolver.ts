import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { LoginArgs } from './dto/args/login.args';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { GetTokenPairResponse } from './dto/types/get-token-pair-response.type';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { Logger } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenPair } from './interfaces/token.interface';
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Query(() => GetTokenPairResponse)
  async login(
    @Args() loginData: LoginArgs,
    @Context() context: any,
  ): Promise<TokenPair> {
    this.logger.debug(
      'login resolver: initiated with email: ',
      loginData.email,
    );
    const user = context.req.user;
    return this.authService.login({ sub: user.id, email: user.email });
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Query(() => GetTokenPairResponse)
  async getTokenPair(
    @Args('currentRefreshToken') currentRefreshToken: string,
  ): Promise<TokenPair> {
    return this.tokenService.getTokenPair({ currentRefreshToken });
  }

  // TODO: Check which guard needs to be used here
  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserData') createUserData: CreateUserInput) {
    return this.authService.createUser(createUserData);
  }
}
