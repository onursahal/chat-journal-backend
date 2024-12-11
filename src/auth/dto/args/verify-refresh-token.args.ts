import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class VerifyRefreshTokenArgs {
  @Field()
  refresh_token: string;
}
