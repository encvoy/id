import { Module, forwardRef } from '@nestjs/common';
import { OidcModule } from '../oidc/oidc.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsModule } from '../settings/settings.module';
import { ProviderFactoryModule } from './factory.module';
import { ProvidersController } from './providers.controller';
import { ProviderService } from './providers.service';

@Module({
  imports: [forwardRef(() => OidcModule), ProviderFactoryModule, RepositoryModule, SettingsModule],
  controllers: [ProvidersController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
