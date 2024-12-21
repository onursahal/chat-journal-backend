import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ErrorService, ErrorCode } from 'src/error/error.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger = new Logger(LocalStrategy.name);
  constructor(
    private authService: AuthService,
    private errorService: ErrorService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser({ email, password });

    if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

    return user;
  }
}
