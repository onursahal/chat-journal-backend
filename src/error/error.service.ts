import { Injectable } from '@nestjs/common';
import {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from '@nestjs/jwt';
import { GraphQLError } from 'graphql';

export enum ErrorType {
  AUTH = 'AUTH',
  USER = 'USER',
  UNEXPECTED = 'UNEXPECTED',
}

export enum ErrorCode {
  ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED',
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  TOKEN_SIGNING_ERROR = 'TOKEN_SIGNING_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  SOMETHING_WENT_WRONG = 'SOMETHING_WENT_WRONG',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

const errorDetails: Record<ErrorCode, ErrorDetail> = {
  [ErrorCode.ACCESS_TOKEN_EXPIRED]: {
    message: 'Access token expired',
    extensions: {
      type: ErrorType.AUTH,
      errorCode: ErrorCode.ACCESS_TOKEN_EXPIRED,
    },
  },
  [ErrorCode.INVALID_ACCESS_TOKEN]: {
    message: 'Invalid access token',
    extensions: {
      type: ErrorType.AUTH,
      errorCode: ErrorCode.INVALID_ACCESS_TOKEN,
    },
  },
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: {
    message: 'Refresh token expired',
    extensions: {
      type: ErrorType.AUTH,
      errorCode: ErrorCode.REFRESH_TOKEN_EXPIRED,
    },
  },
  [ErrorCode.INVALID_REFRESH_TOKEN]: {
    message: 'Invalid refresh token',
    extensions: {
      type: ErrorType.AUTH,
      errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
    },
  },
  [ErrorCode.TOKEN_SIGNING_ERROR]: {
    message: 'Token signing error',
    extensions: {
      type: ErrorType.AUTH,
      errorCode: ErrorCode.TOKEN_SIGNING_ERROR,
    },
  },
  [ErrorCode.USER_NOT_FOUND]: {
    message: 'User not found',
    extensions: {
      type: ErrorType.USER,
      errorCode: ErrorCode.USER_NOT_FOUND,
    },
  },
  [ErrorCode.USER_ALREADY_EXISTS]: {
    message: 'User already exists',
    extensions: {
      type: ErrorType.USER,
      errorCode: ErrorCode.USER_ALREADY_EXISTS,
    },
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: 'Invalid credentials',
    extensions: {
      type: ErrorType.USER,
      errorCode: ErrorCode.INVALID_CREDENTIALS,
    },
  },
  [ErrorCode.SOMETHING_WENT_WRONG]: {
    message: 'An error occurred',
    extensions: {
      type: ErrorType.UNEXPECTED,
      errorCode: ErrorCode.SOMETHING_WENT_WRONG,
    },
  },
};

export interface ErrorDetail {
  message: string;
  extensions: {
    type: ErrorType;
    errorCode: ErrorCode;
  };
}

@Injectable()
export class ErrorService {
  createError(errorCode: ErrorCode) {
    const { message, extensions } = errorDetails[errorCode];

    if (!message || !extensions)
      return new GraphQLError(ErrorCode.SOMETHING_WENT_WRONG, {
        extensions: {
          type: ErrorType.UNEXPECTED,
          errorCode: ErrorCode.SOMETHING_WENT_WRONG,
        },
      });
    return new GraphQLError(message, { extensions });
  }
  handleJwtError(error: Error, isAccessToken: boolean) {
    if (error instanceof JsonWebTokenError) {
      return this.createError(
        isAccessToken
          ? ErrorCode.INVALID_ACCESS_TOKEN
          : ErrorCode.INVALID_REFRESH_TOKEN,
      );
    }
    if (error instanceof TokenExpiredError || error instanceof NotBeforeError) {
      return this.createError(
        isAccessToken
          ? ErrorCode.ACCESS_TOKEN_EXPIRED
          : ErrorCode.REFRESH_TOKEN_EXPIRED,
      );
    }
    return this.createError(ErrorCode.SOMETHING_WENT_WRONG);
  }
}
