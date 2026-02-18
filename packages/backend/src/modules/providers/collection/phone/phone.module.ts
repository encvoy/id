import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../repository/repository.module';
import { KloudModule } from '../kloud';
import { PhoneController } from './phone.controller';
import { PhoneService } from './phone.service';

@Module({
  imports: [RepositoryModule, KloudModule],
  controllers: [PhoneController],
  providers: [PhoneService],
  exports: [PhoneService],
})
export class PhoneModule {}
