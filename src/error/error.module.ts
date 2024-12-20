import { Module, Global } from '@nestjs/common';
import { ErrorService } from './error.service';

@Global()
@Module({
  exports: [ErrorService],
  providers: [ErrorService],
})
export class ErrorModule {}
