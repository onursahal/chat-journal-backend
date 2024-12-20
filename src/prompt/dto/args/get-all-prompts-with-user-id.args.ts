import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class GetAllPromptsWithUserIdArgs {
  @Field()
  @IsNotEmpty()
  userId: string;
}
