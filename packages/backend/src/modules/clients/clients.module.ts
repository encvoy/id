import { Module, forwardRef } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientService } from './clients.service';
import { OidcModule } from '../oidc/oidc.module';
import { UsersModule } from '../users/users.module';
import { RepositoryModule } from '../repository/repository.module';
import { RedisModule } from '../redis/redis.module';
import { SettingsModule } from '../settings/settings.module';
import { MailModule } from '../providers/collection/email/email.module';
import { BrandingController } from './branding.controller';
import { BrandingIconsService } from './branding-icons.service';

@Module({
  imports: [
    forwardRef(() => OidcModule),
    forwardRef(() => UsersModule),
    RepositoryModule,
    RedisModule,
    SettingsModule,
    MailModule,
  ],
  controllers: [ClientsController, BrandingController],
  providers: [ClientService, BrandingIconsService],
  exports: [ClientService, BrandingIconsService],
})
export class ClientModule {}
