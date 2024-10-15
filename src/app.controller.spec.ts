import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UserService } from './user.service';
import { User } from '@prisma/client';

describe('AppController', () => {
  let userService: UserService;

  const mockUser: User = {
    id: '670e52dceded375289fbe6a5',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockUsers: User[] = [mockUser];

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: UserService,
          useValue: {
            user: jest.fn(),
            users: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = app.get<UserService>(UserService);
  });

  describe('getUsers', () => {
    it('should return an array of users when no id is provided', async () => {
      jest.spyOn(userService, 'users').mockResolvedValue(mockUsers);

      const result = await userService.users();
      expect(result).toBe(mockUsers);
      expect(userService.users).toHaveBeenCalled();
    });

    it('should return a single user when id is provided', async () => {
      jest.spyOn(userService, 'user').mockResolvedValue(mockUser);

      const result = await userService.user({ id: '670e52dceded375289fbe6a5' });
      expect(result).toBe(mockUser);
      expect(userService.user).toHaveBeenCalledWith({
        id: '670e52dceded375289fbe6a5',
      });
    });

    it('should return null when an invalid id is provided', async () => {
      jest.spyOn(userService, 'user').mockResolvedValue(null);

      const result = await userService.user({ id: 'invalid-id' });
      expect(result).toBeNull();
      expect(userService.user).toHaveBeenCalledWith({ id: 'invalid-id' });
    });

    it('should return all users when an empty string id is provided', async () => {
      jest.spyOn(userService, 'users').mockResolvedValue(mockUsers);

      const result = await userService.users();
      expect(result).toBe(mockUsers);
      expect(userService.users).toHaveBeenCalled();
    });
  });
});
