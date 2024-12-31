import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { TokenService } from '../token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private tokenService: TokenService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('currentRefreshToken'),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(request: { body: { currentRefreshToken: string } }) {
    const currentRefreshToken = request.body.currentRefreshToken;
    return this.tokenService.validateRefreshToken(currentRefreshToken);
  }
}
