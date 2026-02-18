import { Module, NestModule } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ExternalAccountRepository } from './external.repository';
import { SettingsRepository } from '../settings/settings.repository';
import { RoleRepository } from './role.repository';

@Module({
  providers: [UserRepository, ExternalAccountRepository, SettingsRepository, RoleRepository],
  exports: [UserRepository, ExternalAccountRepository, SettingsRepository, RoleRepository],
})
export class RepositoryModule implements NestModule {
  configure() {}
}
