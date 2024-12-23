import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { ErrorService } from 'src/error/error.service';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);
  constructor(private errorService: ErrorService) {
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

  handleRequest(err, user, info) {
    if (info instanceof Error || err) {
      this.logger.debug('Error in handleRequest: ', info || err);
      throw this.errorService.handleJwtError(info || err, true);
    }

    // NOTE: for now user is not used and returns true, but it can be used in the future
    return user;
  }
}
