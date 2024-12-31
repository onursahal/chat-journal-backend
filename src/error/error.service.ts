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
  PRISMA = 'PRISMA',
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
  MALFORMED_USER_ID = 'MALFORMED_USER_ID',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  RELATION_NOT_FOUND = 'RELATION_NOT_FOUND',
  DATABASE_CONNECT_ERROR = 'DATABASE_CONNECT_ERROR',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  NULL_CONSTRAINT_VIOLATION = 'NULL_CONSTRAINT_VIOLATION',
  TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
  COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
  BCRYPT_ERROR = 'BCRYPT_ERROR',
}

const prismaErrorCodeMap = {
  P2002: ErrorCode.USER_ALREADY_EXISTS,
  P2003: ErrorCode.FOREIGN_KEY_VIOLATION,
  P2023: ErrorCode.MALFORMED_USER_ID,
  P2025: ErrorCode.RECORD_NOT_FOUND,
  P2000: ErrorCode.INVALID_DATA_TYPE,
  P2005: ErrorCode.INVALID_FIELD_VALUE,
  P2006: ErrorCode.INVALID_DATA_TYPE,
  P2011: ErrorCode.NULL_CONSTRAINT_VIOLATION,
  P2012: ErrorCode.REQUIRED_FIELD_MISSING,
  P2015: ErrorCode.RELATION_NOT_FOUND,
  P2021: ErrorCode.TABLE_NOT_FOUND,
  P2022: ErrorCode.COLUMN_NOT_FOUND,
};

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
  [ErrorCode.MALFORMED_USER_ID]: {
    message: 'This user id is not valid',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.MALFORMED_USER_ID,
    },
  },
  [ErrorCode.FOREIGN_KEY_VIOLATION]: {
    message: 'Referenced record does not exist',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.FOREIGN_KEY_VIOLATION,
    },
  },
  [ErrorCode.RECORD_NOT_FOUND]: {
    message: 'Record not found',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.RECORD_NOT_FOUND,
    },
  },
  [ErrorCode.INVALID_DATA_TYPE]: {
    message: 'Invalid data type provided',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.INVALID_DATA_TYPE,
    },
  },
  [ErrorCode.REQUIRED_FIELD_MISSING]: {
    message: 'Required field is missing',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.REQUIRED_FIELD_MISSING,
    },
  },
  [ErrorCode.RELATION_NOT_FOUND]: {
    message: 'Related record not found',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.RELATION_NOT_FOUND,
    },
  },
  [ErrorCode.DATABASE_CONNECT_ERROR]: {
    message: 'Database connection error',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.DATABASE_CONNECT_ERROR,
    },
  },
  [ErrorCode.INVALID_FIELD_VALUE]: {
    message: 'Invalid value for field',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.INVALID_FIELD_VALUE,
    },
  },
  [ErrorCode.NULL_CONSTRAINT_VIOLATION]: {
    message: 'Field cannot be null',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.NULL_CONSTRAINT_VIOLATION,
    },
  },
  [ErrorCode.TABLE_NOT_FOUND]: {
    message: 'Database table not found',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.TABLE_NOT_FOUND,
    },
  },
  [ErrorCode.COLUMN_NOT_FOUND]: {
    message: 'Database column not found',
    extensions: {
      type: ErrorType.PRISMA,
      errorCode: ErrorCode.COLUMN_NOT_FOUND,
    },
  },
  [ErrorCode.SOMETHING_WENT_WRONG]: {
    message: 'An error occurred',
    extensions: {
      type: ErrorType.UNEXPECTED,
      errorCode: ErrorCode.SOMETHING_WENT_WRONG,
    },
  },
  [ErrorCode.BCRYPT_ERROR]: {
    message: 'An error occurred',
    extensions: {
      type: ErrorType.UNEXPECTED,
      errorCode: ErrorCode.BCRYPT_ERROR,
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
  createError(
    errorCode: ErrorCode,
    extra?: Record<string, string | number | boolean | []>,
  ) {
    const { message, extensions } = errorDetails[errorCode];

    if (!message || !extensions)
      return new GraphQLError(ErrorCode.SOMETHING_WENT_WRONG, {
        extensions: {
          type: ErrorType.UNEXPECTED,
          errorCode: ErrorCode.SOMETHING_WENT_WRONG,
        },
      });
    return new GraphQLError(message, {
      extensions: {
        type: extensions.type,
        errorCode: extensions.errorCode,
        ...extra,
      },
    });
  }

  handleJwtError(error: Error, isAccessToken: boolean) {
    if (error instanceof TokenExpiredError || error instanceof NotBeforeError) {
      return this.createError(
        isAccessToken
          ? ErrorCode.ACCESS_TOKEN_EXPIRED
          : ErrorCode.REFRESH_TOKEN_EXPIRED,
      );
    }
    if (error instanceof JsonWebTokenError) {
      return this.createError(
        isAccessToken
          ? ErrorCode.INVALID_ACCESS_TOKEN
          : ErrorCode.INVALID_REFRESH_TOKEN,
      );
    }

    return this.createError(ErrorCode.SOMETHING_WENT_WRONG);
  }

  handlePrismaError(prismaError: {
    code: string;
    meta?: { modelName: string };
  }) {
    const {
      code,
      meta: { modelName },
    } = prismaError;
    if (!Object.keys(prismaErrorCodeMap).some((key) => key === code))
      return this.createError(ErrorCode.SOMETHING_WENT_WRONG);

    console.log('modelName: ', modelName);
    return this.createError(
      prismaErrorCodeMap[code],
      modelName && { type: modelName.toUpperCase() },
    );
  }
}
