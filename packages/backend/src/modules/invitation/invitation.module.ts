import { Module, NestModule, forwardRef } from '@nestjs/common';
import { LoggerModule } from '../logger';
import { PrismaModule } from '../prisma';
import { MailModule } from '../providers/collection/email';
import { SettingsModule } from '../settings';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';

@Module({
  imports: [PrismaModule, MailModule, forwardRef(() => LoggerModule), SettingsModule],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule implements NestModule {
  configure() {}
}
