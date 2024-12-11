import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') implements CanActivate {
  canActivate(context: ExecutionContext) {
    GqlExecutionContext.create(context);
    return true;
  }
}
