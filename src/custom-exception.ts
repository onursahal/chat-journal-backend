import { UnauthorizedException } from '@nestjs/common';

export class CustomAuthException extends UnauthorizedException {
  constructor({ message, errorCode }) {
    super({ message, errorCode });
  }
}
