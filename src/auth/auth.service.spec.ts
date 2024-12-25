import { PrismaService } from '../db/prisma.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenPair, TokenPayload } from './interfaces/token.interface';
import { ErrorCode, ErrorService } from '../error/error.service';
import { User } from '../user/user.interface';
import { CreateUser, UserCredentials } from './interfaces/auth.interface';
import * as bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';

describe('AuthService', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let prismaService: PrismaService;
  let errorService: ErrorService;

  const mockTokenService = {
    getTokenPair: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockErrorService = {
    createError: jest.fn(),
    handlePrismaError: jest.fn(),
  };

  const mockTokenPair: TokenPair = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaUser: User & { password: string } = {
    ...mockUser,
    password: 'hashedPassword',
  };

  const mockUserCredentials: UserCredentials = {
    email: 'test@test.com',
    password: 'password',
  };

  const mockCreateUserData: CreateUser = {
    ...mockUserCredentials,
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockPayload: TokenPayload = {
    sub: '1',
    email: 'test@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TokenService, useValue: mockTokenService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ErrorService, useValue: mockErrorService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    errorService = module.get<ErrorService>(ErrorService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(tokenService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(errorService).toBeDefined();
  });

  describe('login', () => {
    it('should return a token pair', async () => {
      const mockPayload: TokenPayload = {
        sub: '1',
        email: 'test@test.com',
      };

      mockTokenService.getTokenPair.mockResolvedValue(mockTokenPair);

      const result = await authService.login(mockPayload);

      expect(result).toEqual(mockTokenPair);
      expect(mockTokenService.getTokenPair).toHaveBeenCalledWith({
        payload: mockPayload,
      });
    });
  });

  describe('createUser', () => {
    it('should return user', async () => {
      const mockCreateUserData: CreateUser = {
        email: 'test@test.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockHashedPassword = 'hashedPassword';

      // TODO: Define bcrypt as a module
      const hashSpy = jest.spyOn(
        bcrypt as {
          hash(
            data: string | Buffer,
            saltOrRounds: string | number,
          ): Promise<string>;
        },
        'hash',
      );

      hashSpy.mockResolvedValue(mockHashedPassword);

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await authService.createUser(mockCreateUserData);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateUserData,
          password: mockHashedPassword,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });
      expect(hashSpy).toHaveBeenCalledWith(mockCreateUserData.password, 10);
    });
    it('should throw an error if user already exists', async () => {
      const userAlreadyExistError = new GraphQLError('User already exists', {
        extensions: {
          errorCode: ErrorCode.USER_ALREADY_EXISTS,
        },
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockErrorService.createError.mockReturnValue(userAlreadyExistError);

      await expect(authService.createUser(mockCreateUserData)).rejects.toThrow(
        userAlreadyExistError,
      );
    });
    it('should throw an error if prisma create fails', async () => {
      const prismaCreateError = new GraphQLError('Prisma create error', {
        extensions: {
          errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
        },
      });

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      mockPrismaService.user.create.mockRejectedValue(prismaCreateError);
      mockErrorService.handlePrismaError.mockReturnValue(prismaCreateError);

      await expect(authService.createUser(mockCreateUserData)).rejects.toThrow(
        prismaCreateError,
      );
    });
  });

  describe('validateUserFromAccessToken', () => {
    it('should return true', async () => {
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await authService.validateUserFromAccessToken(mockPayload);

      expect(result).toBe(true);
      expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          id: mockPayload.sub,
        },
      });
    });
    it('should throw an error if user not found', async () => {
      const mockPayload: TokenPayload = {
        sub: '1',
        email: 'test@test.com',
      };

      const userNotFoundError = new GraphQLError('User not found', {
        extensions: {
          errorCode: ErrorCode.USER_NOT_FOUND,
        },
      });

      mockErrorService.handlePrismaError.mockReturnValue(userNotFoundError);
      mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(
        userNotFoundError,
      );

      await expect(
        authService.validateUserFromAccessToken(mockPayload),
      ).rejects.toThrow(userNotFoundError);
    });
  });
  describe('validateUser', () => {
    it('should return user', async () => {
      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(
        mockPrismaUser,
      );

      // TODO: Define bcrypt as a module
      const compareSpy = jest.spyOn(
        bcrypt as {
          compare(data: string | Buffer, encrypted: string): Promise<boolean>;
        },
        'compare',
      );

      compareSpy.mockResolvedValue(true);

      const result = await authService.validateUser(mockUserCredentials);

      expect(result).toEqual({ ...mockPrismaUser, password: undefined });
      expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          email: mockUserCredentials.email,
        },
      });
      expect(compareSpy).toHaveBeenCalledWith(
        mockUserCredentials.password,
        mockPrismaUser.password,
      );
    });
    it('should throw an error if user not found', async () => {
      const userNotFoundError = new GraphQLError('User not found', {
        extensions: {
          errorCode: ErrorCode.USER_NOT_FOUND,
        },
      });

      mockErrorService.handlePrismaError.mockReturnValue(userNotFoundError);
      mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(
        userNotFoundError,
      );

      await expect(
        authService.validateUser(mockUserCredentials),
      ).rejects.toThrow(userNotFoundError);
    });
    it('should throw an error if password is invalid', async () => {
      const invalidCredentialsError = new GraphQLError('Invalid credentials', {
        extensions: {
          errorCode: ErrorCode.INVALID_CREDENTIALS,
        },
      });

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(
        mockPrismaUser,
      );
      mockErrorService.createError.mockReturnValue(invalidCredentialsError);
      // TODO: Define bcrypt as a module
      const compareSpy = jest.spyOn(
        bcrypt as {
          compare(data: string | Buffer, encrypted: string): Promise<boolean>;
        },
        'compare',
      );
      compareSpy.mockResolvedValue(false);

      await expect(
        authService.validateUser(mockUserCredentials),
      ).rejects.toThrow(invalidCredentialsError);
    });
  });
});
