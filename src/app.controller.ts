import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  async getUserById(
    @Query('id') id: string,
  ): Promise<UserModel | UserModel[] | null> {
    console.log('id', id);
    if (!!id) return this.userService.user({ id });
    return this.userService.users();
  }

  @Post('user')
  async createUser(@Body() data: Prisma.UserCreateInput): Promise<UserModel> {
    console.log('data', data);
    return this.userService.createUser(data);
  }
}
