import * as common from '@nestjs/common';
import { Request, Response } from 'express';
import fs from 'fs';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { USER_ID_KEY } from 'src/decorators/userId.decorator';
import { ESettingsNames, SettingsService } from 'src/modules/settings';
import { CustomLogger } from '../../modules/logger/logger.service';
import { ErrorHandlingService } from './error.handling.service';

@common.Catch()
export class GlobalExceptionFilter implements common.ExceptionFilter {
  constructor(
    private readonly errorHandlingService: ErrorHandlingService,
    @common.Inject(CustomLogger) private readonly logger: CustomLogger,
    private readonly settingService: SettingsService,
    private readonly i18nService: I18nService<Record<string, string>>,
  ) {}

  async catch(exception: common.HttpException, host: common.ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & Record<string, string | null>>();

    const userId = req[USER_ID_KEY] ?? null;

    // Nestjs doesn't allow error handling via a chain of error interceptors, so
    // We implement error handling manually
    // We call globally registered error handlers
    await this.errorHandlingService.handleError(exception, userId, req);

    if (!(exception instanceof common.HttpException)) {
      console.error(exception);
      return;
    }

    if (exception instanceof common.InternalServerErrorException) {
      let causeMsg = '';
      if (exception.cause) {
        if (exception.cause instanceof Error) {
          causeMsg = exception.cause.message;
        } else if (typeof exception.cause === 'string') {
          causeMsg = exception.cause;
        } else if (typeof exception.cause === 'object') {
          causeMsg = JSON.stringify(exception.cause);
        }
        console.error(exception.cause);
      }
      if (causeMsg) {
        exception.message += `: ${causeMsg}`;
      }
    }

    const status = exception.getStatus();

    if (status === common.HttpStatus.UNPROCESSABLE_ENTITY) {
      if (req.file) {
        const file = req.file;
        await fs.promises.unlink(file.path);
      } else if (req.files) {
        const fileskeys = Object.keys(req.files);
        for (const key of fileskeys) await fs.promises.unlink(req.files[key][0].path);
      }
    }

    const locale = await this.settingService.getSettingsByName<{ default_language: string }>(
      ESettingsNames.i18n,
    );
    const i18nLang = I18nContext.current()?.lang || locale?.default_language || 'ru';
    const translationArgs =
      exception.cause && typeof exception.cause === 'object' && !(exception.cause instanceof Error)
        ? { args: exception.cause as Record<string, unknown> }
        : {};
    const translation = this.i18nService.translate(exception.message, {
      lang: i18nLang,
      ...translationArgs,
    });

    const exceptionResponse = exception.getResponse() as {
      text: string;
      data?: string;
    };
    this.logger.error(req.method + ' ' + req.url, translation, exception.stack);

    // Extract additional details from cause if present
    let additionalData = exceptionResponse.data;
    if ((exception as any).cause) {
      const cause = (exception as any).cause;
      if (cause instanceof Error) {
        additionalData = cause.message;
      } else if (typeof cause === 'string') {
        additionalData = cause;
      } else if (typeof cause === 'object') {
        additionalData = JSON.stringify(cause);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: translation,
      errorCode: exception.message === translation ? null : exception.message,
      details: additionalData,
    });
  }
}
