import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);
  constructor() {
    super();
  }
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const args = ctx.getArgs();

    this.logger.debug(`Args are: ${JSON.stringify(args)}`);

    request.body = {
      email: args.email,
      password: args.password,
    };

    this.logger.debug(`Request is: ${JSON.stringify(request.body)}`);

    return request;
  }
}
