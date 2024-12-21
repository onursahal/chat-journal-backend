import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { ErrorService, ErrorCode } from 'src/error/error.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private userService: UserService,
    private errorService: ErrorService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string; exp: number }) {
    const { sub: id, exp } = payload;
    const user = await this.userService.findOneById({ id });

    if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

    return { user, refreshTokenExpiresAt: new Date(exp * 1000) };
  }
}
