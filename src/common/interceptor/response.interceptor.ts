import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data?.message && data?.data) {
          return {
            success: true,
            message: data.message,
            data: data.data,
          };
        }

        return {
          success: true,
          message: 'Request successful',
          data,
        };
      }),
    );
  }
}
