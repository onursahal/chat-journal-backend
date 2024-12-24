import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class GetTokenPairResponse {
  @Field()
  access_token: string;

  @Field()
  refresh_token: string;
}
