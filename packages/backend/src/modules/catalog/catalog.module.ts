import { Module } from '@nestjs/common';
import { ClientModule } from '../clients';
import { RedisModule } from '../redis/redis.module';
import { SettingsModule } from '../settings/settings.module';
import { CatalogController } from './catalog.controller';
import { CatalogService, SettingsCatalogName } from './catalog.service';
import { prisma } from '../prisma/prisma.client';

@Module({
  imports: [RedisModule, SettingsModule, ClientModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {
  async onModuleInit() {
    await prisma.settings.upsert({
      where: { name: SettingsCatalogName },
      create: {
        name: SettingsCatalogName,
        value: false,
        title: 'Feature flag for catalog module',
        public: false,
      },
      update: {},
    });
  }
}
