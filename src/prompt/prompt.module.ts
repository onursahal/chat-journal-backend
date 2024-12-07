import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptResolver } from './prompt.resolver';

@Module({
  providers: [PromptService, PromptResolver],
})
export class PromptModule {}
