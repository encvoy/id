import { Module } from '@nestjs/common';
import { EProviderTypes } from 'src/enums';
import { prisma } from 'src/modules/prisma/prisma.client';
import { RedisModule } from '../../../redis/redis.module';
import { SettingsModule } from '../../../settings/settings.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [RedisModule, SettingsModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class MailModule {
  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    const emailProviders = await prisma.provider.findMany({
      where: {
        type: {
          in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM],
        },
      },
      select: { id: true },
    });

    for (const provider of emailProviders) {
      await this.emailService.ensureProviderEmailTemplates(provider.id);
    }
  }
}
