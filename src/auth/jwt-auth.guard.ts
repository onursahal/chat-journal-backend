import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Errors } from 'src/errors';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    console.log('canActivate function called');
    const ctx = GqlExecutionContext.create(context);
    const token = this.getToken(ctx);

    if (!token) throw new UnauthorizedException('Invalid token');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      console.log(payload);
    } catch (error) {
      Errors.throwError(error.name);
    }

    return true;
  }

  private getToken(ctx: GqlExecutionContext) {
    const rawAuthorization = ctx.getContext().req.headers.authorization;

    const token = rawAuthorization.split(' ')[1];
    return token;
  }
}
