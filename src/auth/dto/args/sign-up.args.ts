import { Field, ArgsType } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@ArgsType()
export class SignUpArgs {
  @Field()
  @IsEmail({}, { message: 'Email cannot be empty or format is invalid' })
  email: string;

  @Field()
  @MinLength(8, { message: 'Password cannot be less than 8 characters' })
  password: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}
