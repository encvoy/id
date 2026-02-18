import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { ErrorHandlingModule } from 'src/middlewares/exceptionFilters/error.handling.module';
import { AccessGuard, GlobalExceptionFilter, LoggingInterceptor, ScopeGuard } from '../middlewares';
import { AuthModule } from './auth';
import { AvatarModule } from './avatar';
import { CatalogModule } from './catalog';
import { ClientModule } from './clients';
import { InteractionModule } from './interaction';
import { LoggerModule } from './logger';
import { OidcModule } from './oidc';
import { PrismaModule } from './prisma';
import { ProviderModule } from './providers';
import { OtpModule } from './providers/collection/otp/otp.module';
import { ProviderFactoryModule } from './providers/factory.module';
import { RedisModule } from './redis';
import { RepositoryModule } from './repository';
import { ScopeModule } from './scopes';
import { SessionModule } from './sessions';
import { SettingsModule } from './settings';
import { UsersModule } from './users';
import { VerificationModule } from './verification';
import { WebAuthnModule } from './providers/collection/webauthn';
import { MtlsModule } from './providers/collection/mtls';
import { SentryModule } from './sentry/sentry.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InvitationModule } from './invitation';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ScopeGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class RootModule {
  static register(extensionsModules: any[]): DynamicModule {
    return {
      module: RootModule,
      imports: [
        SentryModule,
        ...extensionsModules,
        I18nModule.forRoot({
          fallbackLanguage: 'en',
          fallbacks: {
            'es-ES': 'es',
            'es-MX': 'es',
            'it-IT': 'it',
            'de-DE': 'de',
            'ru-RU': 'ru',
            'en-*': 'en',
            'fr-*': 'fr',
          },
          loaderOptions: {
            watch: true,
            path: path.join(__dirname, '../i18n/'),
          },
          resolvers: [
            { use: QueryResolver, options: ['lang'] },
            new AcceptLanguageResolver(),
            new HeaderResolver(['x-lang']),
          ],
        }),
        PrismaModule,
        OidcModule,
        AuthModule,
        InteractionModule,
        UsersModule,
        ClientModule,
        ProviderModule,
        LoggerModule,
        AvatarModule,
        SettingsModule,
        RepositoryModule,
        RedisModule,
        ScopeModule,
        SessionModule,
        VerificationModule,
        ProviderFactoryModule,
        ErrorHandlingModule,
        CatalogModule,
        OtpModule,
        WebAuthnModule,
        MtlsModule,
        InvitationModule,
        ScheduleModule.forRoot(),
      ],
    };
  }
  configure() {}
}
