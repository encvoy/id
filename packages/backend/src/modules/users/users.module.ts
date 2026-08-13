import { Module, NestModule, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientModule } from '../clients/clients.module';
import { InteractionModule } from '../interaction/interaction.module';
import { OidcModule } from '../oidc/oidc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderModule } from '../providers/providers.module';
import { MailModule } from '../providers/collection/email/email.module';
import { PhoneModule } from '../providers/collection/phone/phone.module';
import { RedisModule } from '../redis/redis.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsModule } from '../settings/settings.module';
import { ProfileController } from './profile.controller';
import { UsersContactsService } from './users-contacts.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    forwardRef(() => ClientModule),
    forwardRef(() => OidcModule),
    forwardRef(() => InteractionModule),
    ProviderModule,
    forwardRef(() => AuthModule),
    PhoneModule,
    RepositoryModule,
    RedisModule,
    SettingsModule,
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, UsersContactsService],
  exports: [UsersService, UsersContactsService],
})
export class UsersModule implements NestModule {
  configure() {}
}
