import { TokenService } from './token.service';
import { PrismaService } from '../db/prisma.service';
import { ErrorCode, ErrorService } from '../error/error.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenPair } from './interfaces/token.interface';
import { TokenPayload } from './interfaces/token.interface';
import { User } from '../user/user.interface';
import { RefreshToken } from './interfaces/token.interface';
import { GraphQLError } from 'graphql';
describe('TokenService', () => {
  let tokenService: TokenService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let errorService: ErrorService;

  const mockPrismaService = {
    refreshToken: {
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };

  const mockJwtService = {
    decode: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockErrorService = {
    createError: jest.fn(),
    handlePrismaError: jest.fn(),
  };

  const mockPayload: TokenPayload = {
    sub: '1',
    email: 'test@test.com',
  };

  const mockTokenPair: TokenPair = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };

  // TODO: Define refresh token db type
  const mockActiveRefreshToken: RefreshToken = {
    id: '1',
    userId: '1',
    isActive: true,
    expiresAt: new Date(Date.now() + 1000),
  };

  //   const mockInactiveRefreshToken: RefreshToken = {
  //     ...mockActiveRefreshToken,
  //     isActive: false,
  //   };

  const mockExpiredRefreshToken: RefreshToken = {
    ...mockActiveRefreshToken,
    expiresAt: new Date(Date.now() - 1000),
    isActive: false,
  };

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrentRefreshToken = 'current_refresh_token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ErrorService, useValue: mockErrorService },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    errorService = module.get<ErrorService>(ErrorService);
  });

  it('should be defined', () => {
    expect(tokenService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(errorService).toBeDefined();
  });

  describe('getTokenPair', () => {
    it('should return a token pair with payload', async () => {
      mockJwtService.signAsync.mockReturnValue(mockTokenPair.access_token);

      jest
        .spyOn(tokenService, 'generateRefreshToken')
        .mockResolvedValue(mockTokenPair.refresh_token);

      const result = await tokenService.getTokenPair({ payload: mockPayload });

      expect(result).toEqual(mockTokenPair);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(mockPayload);
    });
    it('should return a token pair with current refresh token', async () => {
      mockJwtService.decode.mockReturnValue(mockPayload);

      mockJwtService.signAsync.mockReturnValue(mockTokenPair.access_token);

      jest
        .spyOn(tokenService, 'generateRefreshToken')
        .mockResolvedValue(mockTokenPair.refresh_token);

      const result = await tokenService.getTokenPair({
        currentRefreshToken: mockCurrentRefreshToken,
      });

      expect(result).toEqual(mockTokenPair);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(mockPayload);
    });
    it('should throw an error if jwt sign fails', async () => {
      const jwtSignError = new GraphQLError('JWT sign error', {
        extensions: {
          errorCode: ErrorCode.TOKEN_SIGNING_ERROR,
        },
      });

      mockJwtService.signAsync.mockRejectedValue(jwtSignError);
      mockErrorService.createError.mockReturnValue(jwtSignError);

      await expect(
        tokenService.getTokenPair({ payload: mockPayload }),
      ).rejects.toThrow(jwtSignError);
    });
  });

  describe('validateRefreshToken', () => {
    // TODO: This test could be a bullshit. Check after
    it('should return a user', async () => {
      mockPrismaService.refreshToken.findFirstOrThrow.mockResolvedValue(
        mockActiveRefreshToken,
      );

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await tokenService.validateRefreshToken(mockPayload);

      expect(result).toEqual(mockUser);
    });
    it('should throw an error if prisma findFirstOrThrow fails', async () => {
      const prismaFindFirstOrThrowError = new GraphQLError(
        'Prisma findFirstOrThrow error',
        {
          extensions: {
            errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
          },
        },
      );

      mockPrismaService.refreshToken.findFirstOrThrow.mockRejectedValue(
        prismaFindFirstOrThrowError,
      );

      mockErrorService.handlePrismaError.mockReturnValue(
        prismaFindFirstOrThrowError,
      );

      await expect(
        tokenService.validateRefreshToken(mockPayload),
      ).rejects.toThrow(prismaFindFirstOrThrowError);
    });
    it('should throw an error if refresh token is expired', async () => {
      const expiredRefreshTokenError = new GraphQLError(
        'Refresh token expired',
        {
          extensions: {
            errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
          },
        },
      );

      mockPrismaService.refreshToken.findFirstOrThrow.mockResolvedValue(
        mockExpiredRefreshToken,
      );

      jest
        .spyOn(tokenService, 'blacklistRefreshTokens')
        .mockResolvedValue({ count: 5 });

      mockErrorService.createError.mockReturnValue(expiredRefreshTokenError);

      await expect(
        tokenService.validateRefreshToken(mockPayload),
      ).rejects.toThrow(expiredRefreshTokenError);
    });
    it('should throw an error if prisma cannot find user', async () => {
      const prismaFindUserError = new GraphQLError('Prisma findUser error', {
        extensions: {
          errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
        },
      });

      mockPrismaService.refreshToken.findFirstOrThrow.mockResolvedValue(
        mockActiveRefreshToken,
      );

      mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(
        prismaFindUserError,
      );
      mockErrorService.handlePrismaError.mockReturnValue(prismaFindUserError);

      await expect(
        tokenService.validateRefreshToken(mockPayload),
      ).rejects.toThrow(prismaFindUserError);
    });
  });
  describe('generateRefreshToken', () => {
    const generateRefreshTokenMocking = async (isPayload: boolean) => {
      if (!isPayload) mockJwtService.decode.mockResolvedValueOnce(mockPayload);
      jest
        .spyOn(tokenService, 'blacklistRefreshTokens')
        .mockResolvedValue({ count: 5 });

      mockJwtService.signAsync.mockResolvedValue(mockTokenPair.refresh_token);
      mockJwtService.decode.mockResolvedValueOnce({
        ...mockPayload,
        exp: 1234567890,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue(
        mockActiveRefreshToken,
      );

      return await tokenService.generateRefreshToken(
        isPayload
          ? {
              payload: mockPayload,
            }
          : { currentRefreshToken: mockCurrentRefreshToken },
      );
    };
    const generateRefreshTokenSuccessAssertions = (result) => {
      expect(result).toEqual(mockTokenPair.refresh_token);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(mockPayload);
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          id: mockTokenPair.refresh_token,
          expiresAt: new Date(1234567890 * 1000),
          userId: mockPayload.sub,
        },
      });
    };
    it('should return a refresh token with payload', async () => {
      const result = await generateRefreshTokenMocking(true);
      generateRefreshTokenSuccessAssertions(result);
    });
    it('should return a refresh token with current refresh token', async () => {
      const result = await generateRefreshTokenMocking(false);
      generateRefreshTokenSuccessAssertions(result);
    });
    it('should throw an error if jwt sign fails', async () => {
      const jwtSignError = new GraphQLError('JWT sign error', {
        extensions: {
          errorCode: ErrorCode.TOKEN_SIGNING_ERROR,
        },
      });
      jest.spyOn(tokenService, 'blacklistRefreshTokens').mockResolvedValue({
        count: 5,
      });
      mockJwtService.signAsync.mockRejectedValue(jwtSignError);
      mockErrorService.createError.mockReturnValue(jwtSignError);

      await expect(
        tokenService.generateRefreshToken({ payload: mockPayload }),
      ).rejects.toThrow(new Error('JWT sign error'));
    });
    it('should throw an error if prisma create fails', async () => {
      const prismaCreateError = new GraphQLError('Prisma create error', {
        extensions: {
          errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
        },
      });

      jest
        .spyOn(tokenService, 'blacklistRefreshTokens')
        .mockResolvedValue({ count: 5 });

      mockJwtService.signAsync.mockResolvedValue(mockTokenPair.refresh_token);
      mockJwtService.decode.mockResolvedValueOnce({
        ...mockPayload,
        exp: 1234567890,
      });
      mockPrismaService.refreshToken.create.mockRejectedValue(
        prismaCreateError,
      );
      mockErrorService.handlePrismaError.mockReturnValue(prismaCreateError);

      await expect(
        tokenService.generateRefreshToken({ payload: mockPayload }),
      ).rejects.toThrow(prismaCreateError);
    });
  });
  describe('blacklistRefreshTokens', () => {
    it('should return a count of blacklisted tokens', async () => {
      const userId = '1';
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({
        count: 5,
      });

      const result = await tokenService.blacklistRefreshTokens(userId);

      expect(result).toEqual({ count: 5 });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });
    it('should throw an error if prisma updateMany fails', async () => {
      const prismaUpdateManyError = new GraphQLError(
        'Prisma updateMany error',
        {
          extensions: {
            errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
          },
        },
      );

      mockPrismaService.refreshToken.updateMany.mockRejectedValue(
        prismaUpdateManyError,
      );
      mockErrorService.handlePrismaError.mockReturnValue(prismaUpdateManyError);

      await expect(
        tokenService.blacklistRefreshTokens(mockUser.id),
      ).rejects.toThrow(prismaUpdateManyError);
    });
  });
});
