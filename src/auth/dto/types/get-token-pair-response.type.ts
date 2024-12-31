import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class GetTokenPairResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
