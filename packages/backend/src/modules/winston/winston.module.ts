import { Module } from '@nestjs/common';
import { OidcModule } from 'src/modules/oidc/oidc.module';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { RepositoryModule } from '../repository/repository.module';
import { WinstonController } from './winston.controller';
import { WinstonService } from './winston.service';

@Module({
  imports: [OidcModule, SettingsModule, RepositoryModule],
  controllers: [WinstonController],
  providers: [WinstonService],
  exports: [WinstonService],
})
export class WinstonModule {
  constructor(private readonly winstonService: WinstonService) {}

  async onModuleInit() {
    await this.winstonService.get();
  }
}
