import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { app } from 'src/main';
import { ESettingsNames, SettingsService } from 'src/modules/settings';
import { CustomLogger } from '../../modules/logger/logger.service';
import { renderWidget, showErrorWidget } from '../../modules/interaction/interaction.helpers';
import { prisma } from '../../modules/prisma';
import { OidcService } from '../../modules/oidc/oidc.service';
import { SentryService } from 'src/modules/sentry';

@Catch()
export class InteractionExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLogger, private readonly oidcService: OidcService) {}

  get settingService() {
    return app.get(SettingsService, { strict: false });
  }

  get sentryService() {
    return app.get(SentryService, { strict: false });
  }

  get i18nService() {
    return app.get(I18nService<Record<string, any>>, { strict: false });
  }

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception.message.includes('Invalid uid')) {
      console.warn(`InteractionController: ${request.method} ${request.url}`, exception.message);
      return;
    }

    // Get the translated error message
    const errorMessage = await this.getTranslatedErrorMessage(exception);
    const causeData = this.extractCauseData(exception);

    if (this.sentryService.enabled) await this.sentryService.captureException(exception, undefined);

    // Log the error with the translated message
    this.logger.error(
      `InteractionController: ${request.method} ${request.url} - ${errorMessage}: Cause: ${causeData}`,
      exception.stack || exception.message,
    );

    try {
      // Try to get interaction and client details
      const interactionDetails = await this.oidcService.interactionDetails(request, response);
      const client_id = interactionDetails?.params?.client_id || request.cookies?.client_id;
      const uid = interactionDetails?.jti;
      const details = interactionDetails?.prompt?.details;

      const client = await prisma.client.findUnique({
        where: { client_id: client_id as string },
      });

      // Return the error widget
      return renderWidget({
        res: response,
        initialRoute: 'error',
        client,
        uid,
        details,
        message: errorMessage,
        messageDetail: causeData,
      });
    } catch (fallbackError) {
      // If we can't get interaction details, show a simple error widget
      this.logger.error('InteractionController Fallback Error:', String(fallbackError));
      return await showErrorWidget(response, errorMessage, null, undefined, causeData);
    }
  }

  private async getTranslatedErrorMessage(exception: any): Promise<string> {
    try {
      // Get the locale
      const locale = await this.settingService.getSettingsByName<{ default_language: string }>(
        ESettingsNames.i18n,
      );

      // Extract the original message
      const originalMessage = this.extractOriginalMessage(exception);

      // Translate the message
      return this.i18nService.translate(originalMessage, {
        lang: locale.default_language,
      });
    } catch (error) {
      // Fallback: return the original message without translation
      console.error(error);
      return this.extractOriginalMessage(exception) || 'Something went wrong';
    }
  }

  private extractOriginalMessage(exception: any): string {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as {
        text?: string;
        message?: string;
        error?: string;
      };

      return (
        exceptionResponse?.text ||
        exceptionResponse?.message ||
        exceptionResponse?.error ||
        exception.message ||
        'Unknown error'
      );
    }

    return exception?.message || exception?.error || 'Unknown error';
  }

  private extractCauseData(exception: any): string | null {
    const cause = (exception as any).cause;

    if (!cause) return null;

    if (cause instanceof Error) {
      return cause.message;
    }

    if (typeof cause === 'string') {
      return cause;
    }

    if (typeof cause === 'object') {
      try {
        return JSON.stringify(cause);
      } catch {
        return String(cause);
      }
    }

    return String(cause);
  }
}
