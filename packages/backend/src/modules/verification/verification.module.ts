import { Module, forwardRef } from '@nestjs/common';
import { OidcModule } from '../oidc';
import { PrismaModule } from '../prisma';
import { ProviderModule } from '../providers';
import { ProviderFactoryModule } from '../providers/factory.module';
import { RepositoryModule } from '../repository';
import { VerificationController } from './verification.controller';

@Module({
  imports: [
    ProviderFactoryModule,
    PrismaModule,
    RepositoryModule,
    ProviderModule,
    forwardRef(() => OidcModule),
  ],
  controllers: [VerificationController],
})
export class VerificationModule {}
