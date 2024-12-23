import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ErrorService } from 'src/error/error.service';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard('jwt-access') {
  private readonly logger = new Logger(JwtAccessAuthGuard.name);
  constructor(private errorService: ErrorService) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext().req;
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
