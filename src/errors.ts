import { GraphQLError } from 'graphql';

enum ExceptionType {
  UNAUTHORIZED_EXCEPTION = 'UNAUTHORIZED_EXCEPTION',
  BAD_REQUEST_EXCEPTION = 'BAD_REQUEST_EXCEPTION',
  UNEXPECTED_EXCEPTION = 'UNEXPECTED_EXCEPTION',
}

enum ErrorCode {
  ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED',
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}

export enum ErrorString {
  TokenExpiredError = 'TokenExpiredError',
  JsonWebTokenError = 'JsonWebTokenError',
  InvalidRefreshToken = 'InvalidRefreshToken',
  UserCannotFound = 'UserCannotFound',
}

type ErrorType = Record<
  ErrorString,
  {
    exceptionType: ExceptionType;
    message: string;
    errorCode: ErrorCode;
  }
>;

const ERROR_TYPE_MAP: ErrorType = {
  [ErrorString.TokenExpiredError]: {
    exceptionType: ExceptionType.UNAUTHORIZED_EXCEPTION,
    message: 'Received access token expired',
    errorCode: ErrorCode.ACCESS_TOKEN_EXPIRED,
  },
  [ErrorString.JsonWebTokenError]: {
    exceptionType: ExceptionType.UNAUTHORIZED_EXCEPTION,
    message: 'Received access token is invalid',
    errorCode: ErrorCode.INVALID_ACCESS_TOKEN,
  },
  [ErrorString.InvalidRefreshToken]: {
    exceptionType: ExceptionType.UNAUTHORIZED_EXCEPTION,
    message: 'Received refresh token is invalid',
    errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
  },
  [ErrorString.UserCannotFound]: {
    exceptionType: ExceptionType.UNEXPECTED_EXCEPTION,
    message: 'User cannot found',
    errorCode: ErrorCode.USER_NOT_FOUND,
  },
};

export class Errors {
  static throwError(errorString: ErrorString) {
    const { exceptionType, message, errorCode } = ERROR_TYPE_MAP[errorString];
    throw new GraphQLError(message, {
      extensions: {
        exceptionType,
        errorCode,
      },
    });
  }
}
