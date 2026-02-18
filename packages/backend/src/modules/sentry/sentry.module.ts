import { Module } from '@nestjs/common';
import { ErrorHandlingModule } from 'src/middlewares/exceptionFilters/error.handling.module';
import { OidcModule } from 'src/modules/oidc/oidc.module';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { RepositoryModule } from '../repository/repository.module';
import { SentryController } from './sentry.controller';
import { SentryService } from './sentry.service';

@Module({
  imports: [OidcModule, SettingsModule, RepositoryModule, ErrorHandlingModule],
  controllers: [SentryController],
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {
  constructor(private readonly sentryService: SentryService) {}
  async onModuleInit() {
    await this.sentryService.get();
    if (this.sentryService.enabled) {
      await this.sentryService.turnOnSentry();
    }
  }
}
