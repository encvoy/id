import { Module } from '@nestjs/common';
import { AvatarsController } from './avatar.controller';
import { AvatarService } from './avatar.service';

@Module({
  controllers: [AvatarsController],
  providers: [AvatarService],
})
export class AvatarModule {}
