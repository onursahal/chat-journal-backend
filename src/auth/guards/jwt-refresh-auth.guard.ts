import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ErrorService } from 'src/error/error.service';
import { GraphQLError } from 'graphql';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
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
    return request;
  }

  handleRequest(err, user, info) {
    if (info instanceof Error || err) {
      const error = info || err;

      if (error instanceof GraphQLError) throw error;
      throw this.errorService.handleJwtError(error, false);
    }

    // NOTE: for now user is not used and returns true, but it can be used in the future
    return user;
  }
}
