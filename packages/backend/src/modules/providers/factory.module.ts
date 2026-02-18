import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { RedisModule } from '../redis';
import { RepositoryModule } from '../repository';
import { SettingsModule } from '../settings';
import { EmailService, MailModule } from './collection/email';
import { EthereumModule, EthereumService } from './collection/ethereum';
import { KloudModule, KloudService } from './collection/kloud';
import { MtlsModule, MtlsService } from './collection/mtls';
import { CustomService, GithubService, GoogleService } from './collection/oauth';
import { PhoneModule, PhoneService } from './collection/phone';
import { HotpService, OtpModule, OtpService } from './collection/otp';
import { WebAuthnModule, WebAuthnService } from './collection/webauthn';
import { ProviderFactory } from './factory.service';
import { EmailCustomModule, EmailCustomService } from './collection/emailc';
import { ProviderService } from './providers.service';

@Module({
  imports: [
    MailModule,
    EthereumModule,
    EmailCustomModule,
    KloudModule,
    PhoneModule,
    RedisModule,
    SettingsModule,
    PrismaModule,
    RepositoryModule,
    WebAuthnModule,
    MtlsModule,
    OtpModule,
  ],
  providers: [
    ProviderFactory,
    ProviderService,
    CustomService,
    GithubService,
    GoogleService,
    EmailService,
    EthereumService,
    KloudService,
    PhoneService,
    OtpService,
    HotpService,
    WebAuthnService,
    MtlsService,
    EmailCustomService,
  ],
  exports: [
    ProviderFactory,
    ProviderService,
    CustomService,
    GithubService,
    GoogleService,
    EmailService,
    EthereumService,
    KloudService,
    PhoneService,
    OtpService,
    HotpService,
    WebAuthnService,
    MtlsService,
    EmailCustomService,
  ],
})
export class ProviderFactoryModule {}
