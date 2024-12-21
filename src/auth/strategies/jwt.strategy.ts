import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { ErrorService, ErrorCode } from 'src/error/error.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private errorService: ErrorService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string; exp: number }) {
    try {
      const { sub: id } = payload;

      const user = await this.userService.findOneById({ id });

      if (!user) throw this.errorService.createError(ErrorCode.USER_NOT_FOUND);

      return user;
    } catch {
      throw this.errorService.createError(ErrorCode.SOMETHING_WENT_WRONG);
    }
  }
}
