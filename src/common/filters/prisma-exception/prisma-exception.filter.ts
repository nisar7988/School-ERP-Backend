import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  implements ExceptionFilter<Prisma.PrismaClientKnownRequestError>
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let message = 'Database error';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.code) {
      case 'P2002':
        message = 'Unique constraint failed';
        statusCode = HttpStatus.CONFLICT;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: exception.message,
    });
  }
}