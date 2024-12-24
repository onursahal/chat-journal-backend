import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);
  constructor(private tokenService: TokenService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('currentRefreshToken'),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string; exp: number }) {
    this.logger.debug(
      'refresh strategy validate: initiated with payload: ',
      payload,
    );
    return this.tokenService.validateRefreshToken(payload);
  }
}
