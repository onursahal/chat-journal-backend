import { ErrorService } from '../error/error.service';
import { PrismaService } from '../db/prisma.service';
import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;
  let errorService: ErrorService;

  const mockPrismaService = {
    user: {
      findUniqueOrThrow: jest.fn(),
    },
  };

  const mockErrorService = {
    handlePrismaError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ErrorService, useValue: mockErrorService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    errorService = module.get<ErrorService>(ErrorService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(errorService).toBeDefined();
  });

  describe('findOneById', () => {
    it('should find a user by id', async () => {
      const mockUser = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await userService.findOneById({ id: '1' });

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
