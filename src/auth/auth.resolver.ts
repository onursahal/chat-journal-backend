import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { SignInArgs } from './dto/args/sign-in.args';
import { SignUpArgs } from './dto/args/sign-up.args';
import { GetTokenPairResponse } from './dto/types/get-token-pair-response.type';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { TokenService } from './token.service';
import { TokenPair } from './interfaces/token.interface';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Query(() => GetTokenPairResponse)
  async signIn(
    @Args() signInArgs: SignInArgs,
    @Context() context: any,
  ): Promise<TokenPair> {
    const user = context.req.user;
    return this.authService.signIn({ sub: user.id, email: user.email });
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Query(() => GetTokenPairResponse)
  async getTokenPair(
    @Args('currentRefreshToken') currentRefreshToken: string,
  ): Promise<TokenPair> {
    return this.tokenService.getTokenPair({ currentRefreshToken });
  }

  // TODO: Check which guard needs to be used here
  @Mutation(() => User)
  async signUp(@Args() signUpArgs: SignUpArgs) {
    return this.authService.signUp(signUpArgs);
  }
}
