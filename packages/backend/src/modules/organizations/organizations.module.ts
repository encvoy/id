import { Module, forwardRef } from '@nestjs/common';
import { ClientModule } from '../clients/clients.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [forwardRef(() => ClientModule)],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
