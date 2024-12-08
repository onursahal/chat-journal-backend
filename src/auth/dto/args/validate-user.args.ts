import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ValidateUserArgs {
  @Field()
  email: string;

  @Field()
  password: string;
}
