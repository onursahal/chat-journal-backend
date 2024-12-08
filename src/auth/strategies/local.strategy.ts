import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ValidateUserArgs } from '../dto/args/validate-user.args';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(data: ValidateUserArgs) {
    const user = await this.authService.validateUser(data);

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
