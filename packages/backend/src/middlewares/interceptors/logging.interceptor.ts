import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLogger } from '../../modules/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(CustomLogger) private readonly logger: CustomLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const now = Date.now();
    const { user_id, client_id } = req.params;

    return next.handle().pipe(
      tap(() => {
        const res: Response = context.switchToHttp().getResponse();

        this.logger.log(undefined, req.method + ' ' + req.url);
      }),
    );
  }
}
