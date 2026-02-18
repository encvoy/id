import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/modules/repository';
import { KloudService } from './kloud.service';

@Module({
  imports: [RepositoryModule],
  providers: [KloudService],
  exports: [KloudService],
})
export class KloudModule {}
