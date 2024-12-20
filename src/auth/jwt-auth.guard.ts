import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ErrorService, ErrorCode } from '../error/error.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private errorService: ErrorService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    console.log('canActivate function called');
    const ctx = GqlExecutionContext.create(context);
    const token = this.getToken(ctx);

    if (!token)
      throw this.errorService.createError(ErrorCode.INVALID_ACCESS_TOKEN);

    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw this.errorService.handleJwtError(error, true);
    }

    return true;
  }

  private getToken(ctx: GqlExecutionContext) {
    const rawAuthorization = ctx.getContext().req.headers.authorization;

    const token = rawAuthorization.split(' ')[1];
    return token;
  }
}
