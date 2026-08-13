import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SettingsModule } from '../settings/settings.module';
import { ProviderFactory } from './factory.service';
import { ProviderService } from './providers.service';

@Module({
  imports: [DiscoveryModule, SettingsModule],
  providers: [ProviderFactory, ProviderService],
  exports: [ProviderFactory, ProviderService],
})
export class ProviderFactoryModule {}
