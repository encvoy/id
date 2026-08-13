import { Module, forwardRef } from '@nestjs/common';
import { OidcModule } from '../oidc/oidc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderModule } from '../providers/providers.module';
import { ProviderFactoryModule } from '../providers/factory.module';
import { RepositoryModule } from '../repository/repository.module';
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
