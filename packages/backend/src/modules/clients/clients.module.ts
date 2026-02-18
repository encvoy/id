import { Module, forwardRef } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientService } from './clients.service';
import { OidcModule } from '../oidc/oidc.module';
import { UsersModule } from '../users/users.module';
import { RepositoryModule } from '../repository/repository.module';
import { RedisModule } from '../redis/redis.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    forwardRef(() => OidcModule),
    forwardRef(() => UsersModule),
    RepositoryModule,
    RedisModule,
    SettingsModule,
  ],
  controllers: [ClientsController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
