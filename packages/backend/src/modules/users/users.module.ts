import { Module, NestModule, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth';
import { InteractionModule } from '../interaction';
import { LoggerModule } from '../logger';
import { OidcModule } from '../oidc';
import { PrismaModule } from '../prisma';
import { ProviderModule } from '../providers';
import { MailModule } from '../providers/collection/email';
import { PhoneModule } from '../providers/collection/phone';
import { RedisModule } from '../redis';
import { RepositoryModule } from '../repository';
import { SettingsModule } from '../settings';
import { ProfileController } from './profile.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    forwardRef(() => OidcModule),
    forwardRef(() => InteractionModule),
    ProviderModule,
    forwardRef(() => AuthModule),
    forwardRef(() => LoggerModule),
    PhoneModule,
    RepositoryModule,
    RedisModule,
    SettingsModule,
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements NestModule {
  configure() {}
}
