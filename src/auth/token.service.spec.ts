import { TokenService } from './token.service';
import { PrismaService } from '../db/prisma.service';
import { ErrorService } from '../error/error.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenPair } from './interfaces/token.interface';
import { TokenPayload } from './interfaces/token.interface';
import { User } from '../user/user.interface';
import { RefreshToken } from './interfaces/token.interface';

describe('TokenService', () => {
  let tokenService: TokenService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let errorService: ErrorService;

  const mockPrismaService = {
    refreshToken: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    decode: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockErrorService = {
    createError: jest.fn(),
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
  });

  describe('validateRefreshToken', () => {
    // TODO: This test could be a bullshit. Check after
    it('should return a user', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(
        mockActiveRefreshToken,
      );

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await tokenService.validateRefreshToken(mockPayload);

      expect(result).toEqual(mockUser);
    });
  });
  describe('generateRefreshToken', () => {
    it('should return a refresh token with payload', async () => {
      jest
        .spyOn(tokenService, 'blacklistRefreshTokens')
        .mockResolvedValue({ count: 5 });

      mockJwtService.signAsync.mockReturnValue(mockTokenPair.refresh_token);
      mockJwtService.decode.mockReturnValue({ exp: 1234567890 });
      mockPrismaService.refreshToken.create.mockReturnValue({
        id: mockTokenPair.refresh_token,
        expiresAt: new Date(1234567890 * 1000),
        userId: mockPayload.sub,
        isActive: true,
      });

      const result = await tokenService.generateRefreshToken({
        payload: mockPayload,
      });

      expect(result).toEqual(mockTokenPair.refresh_token);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(mockPayload);
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          id: mockTokenPair.refresh_token,
          expiresAt: new Date(1234567890 * 1000),
          userId: mockPayload.sub,
        },
      });
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
  });
});
