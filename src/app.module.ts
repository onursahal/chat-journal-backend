import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { UserModule } from './user/user.module';
import { PromptModule } from './prompt/prompt.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    DbModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      formatError: (error) => ({
        message: error.message,
        extensions: {
          exceptionType: error.extensions.exceptionType,
          errorCode: error.extensions.errorCode,
        },
      }),
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    AuthModule,
    UserModule,
    PromptModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
