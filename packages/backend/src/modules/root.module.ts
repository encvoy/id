import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { GlobalExceptionFilter } from '../middlewares/exceptionFilters/global.exception.filter';
import { ClientIdGuard } from '../middlewares/guards/client.id.guard';
import { OrgIdGuard } from '../middlewares/guards/org.id.guard';
import { ScopeGuard } from '../middlewares/guards/scope.guard';
import { TokenGuard } from '../middlewares/guards/token.guard';
import { UserIdGuard } from '../middlewares/guards/user.id.guard';
import { LoggingInterceptor } from '../middlewares/interceptors/logging.interceptor';
import { SanitizeResponseInterceptor } from '../middlewares/interceptors/sanitize-response.interceptor';
import { ErrorHandlingModule } from 'src/middlewares/exceptionFilters/error.handling.module';
import { AuthModule } from './auth/auth.module';
import { AvatarModule } from './avatar/avatar.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientModule } from './clients/clients.module';
import { GroupsModule } from './groups/groups.module';
import { InteractionModule } from './interaction/interaction.module';
import { InvitationModule } from './invitation/invitation.module';
import { LoggerModule } from './logger/logger.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OidcModule } from './oidc/oidc.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderModule } from './providers/providers.module';
import { ProviderFactoryModule } from './providers/factory.module';
import { MailModule } from './providers/collection/email/email.module';
import { EmailCustomModule } from './providers/collection/emailc/emailc.module';
import { EthereumModule } from './providers/collection/ethereum/ethereum.module';
import { KloudModule } from './providers/collection/kloud/kloud.module';
import { MtlsModule } from './providers/collection/mtls/mtls.module';
import { OauthModule } from './providers/collection/oauth/oauth.module';
import { OtpModule } from './providers/collection/otp/otp.module';
import { PhoneModule } from './providers/collection/phone/phone.module';
import { WebAuthnModule } from './providers/collection/webauthn/webauthn.module';
import { RedisModule } from './redis/redis.module';
import { RepositoryModule } from './repository/repository.module';
import { ScopeModule } from './scopes/scopes.module';
import { SentryModule } from './sentry/sentry.module';
import { SessionModule } from './sessions/sessions.module';
import { SettingsModule } from './settings/settings.module';
import { StatisticsModule } from './statistics/statistics.module';
import { WinstonModule } from './winston/winston.module';
import { TokensModule } from './tokens/tokens.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { CallEventsModule } from './call-events/call-events.module';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserIdGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ClientIdGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OrgIdGuard,
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
  static register(): DynamicModule {
    return {
      module: RootModule,
      imports: [
        SentryModule,
        WinstonModule,
        MailModule,
        EmailCustomModule,
        EthereumModule,
        KloudModule,
        MtlsModule,
        OauthModule,
        OtpModule,
        PhoneModule,
        WebAuthnModule,
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
        PermissionsModule,
        AuthModule,
        InteractionModule,
        UsersModule,
        ClientModule,
        OrganizationsModule,
        ProviderModule,
        LoggerModule,
        CallEventsModule,
        NotificationsModule,
        AvatarModule,
        SettingsModule,
        StatisticsModule,
        RepositoryModule,
        RedisModule,
        ScopeModule,
        SessionModule,
        TokensModule,
        VerificationModule,
        ProviderFactoryModule,
        ErrorHandlingModule,
        CatalogModule,
        GroupsModule,
        InvitationModule,
        ScheduleModule.forRoot(),
      ],
    };
  }
  configure() {}
}
