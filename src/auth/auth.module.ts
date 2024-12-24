import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UserModule } from 'src/user/user.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TokenService } from './token.service';
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtAccessStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
    TokenService,
  ],
})
export class AuthModule {}
