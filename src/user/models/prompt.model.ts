import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Prompt {
  @Field()
  id: string;

  @Field()
  prompt: string;

  @Field({ nullable: true })
  response?: string;
}
