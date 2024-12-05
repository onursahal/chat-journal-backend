import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}
