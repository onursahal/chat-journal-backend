import { Field, ObjectType } from '@nestjs/graphql';
import { Prompt } from './prompt.model';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Prompt], { nullable: true })
  prompts?: Prompt[];
}
