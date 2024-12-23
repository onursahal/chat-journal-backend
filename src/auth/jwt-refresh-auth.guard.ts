import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);
  constructor() {
    super();
  }
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const args = ctx.getArgs();

    request.body = {
      currentRefreshToken: args.currentRefreshToken,
    };
    this.logger.debug('getRequest: request body: ', request.body);
    return request;
  }
}
