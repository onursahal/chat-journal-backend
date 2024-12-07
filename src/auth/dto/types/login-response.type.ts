import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../../user/user.model';

@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user: User;

  @Field()
  token: string;
}
